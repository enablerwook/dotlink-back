import type { Platform, FrameData, AnalysisResult, EngagementMetrics } from "@/lib/types"
import type { AnalysisStatus } from "./types"
import { crawlContent } from "@/infrastructure/apify/apify-client"
import { analyzeContent, uploadVideoForGemini } from "@/infrastructure/ai/gemini-client"
import { createClient } from "@/infrastructure/supabase/server"
import {
  extractAndUploadFrames,
  buildPlaceholderFrames,
  uploadThumbnailFrame,
} from "@/infrastructure/video/frame-extractor"
export { detectPlatform } from "@/domains/analysis/platform-url-validator"

export interface AnalysisResponse {
  id: string
  title: string
  platform: Platform
  url: string
  thumbnailUrl?: string
  analysis: AnalysisResult
  frames: FrameData[]
  createdAt: string
}

// ── 순수 유틸리티 ─────────────────────────────────────────────────────────────

/** script 첫 문장을 타이틀 후보로 추출 (마침표/느낌표/물음표 기준, 최대 40자) */
function extractTitleFromScript(script: string): string {
  if (!script || script.trim() === "(음성 없음)") return ""
  const first = script.split(/[.!?]/)[0].trim()
  return first.slice(0, 40)
}

/** 캡션에서 타이틀 후보 추출 (해시태그 제거 후 앞 40자) */
function extractTitleFromCaption(caption: string): string {
  return caption.slice(0, 40).replace(/#\S+/g, "").trim()
}

// ── DB 접근 레이어 (단일 책임: 각 함수는 하나의 DB 작업만) ─────────────────────

async function getMonthlyUsageCount(userId: string): Promise<number> {
  const supabase = await createClient()
  const yearMonth = new Date().toISOString().slice(0, 7)

  const { data } = await supabase
    .from("usage_records")
    .select("analysis_count")
    .eq("user_id", userId)
    .eq("year_month", yearMonth)
    .single()

  return data?.analysis_count ?? 0
}

export async function getMonthlyUsage(userId: string): Promise<number> {
  return getMonthlyUsageCount(userId)
}

async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  const yearMonth = new Date().toISOString().slice(0, 7)

  await supabase.rpc("increment_analysis_count", {
    p_user_id:    userId,
    p_year_month: yearMonth,
  })
}

async function insertPendingAnalysis(
  userId: string,
  url: string,
  platform: Platform,
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("analyses")
    .insert({ user_id: userId, url, platform, status: "pending" })
    .select("id")
    .single()

  if (error || !data) throw new Error("분석 레코드 생성 실패")
  return data.id
}

async function updateAnalysisCompleted(
  analysisId: string,
  payload: {
    title:               string
    thumbnailUrl?:       string
    postedAt?:           string
    analysis:            AnalysisResult
    frames:              FrameData[]
    likeCount:           number
    viewCount:           number
    commentCount:        number
  },
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("analyses")
    .update({
      status:              "completed",
      title:               payload.title,
      thumbnail_url:       payload.thumbnailUrl ?? null,
      posted_at:           payload.postedAt     ?? null,
      // Gemini System2 분석 결과 (개별 컬럼)
      content_type:        payload.analysis.content_type,
      hooking:             payload.analysis.hooking,
      script:              payload.analysis.script,
      production:          payload.analysis.production,
      selling_point:       payload.analysis.selling_point,
      difficulty:          payload.analysis.difficulty,
      engagement_analysis: payload.analysis.engagement.analysis,
      // Apify 지표 (개별 컬럼)
      caption:             payload.analysis.caption,
      like_count:          payload.likeCount,
      view_count:          payload.viewCount,
      comment_count:       payload.commentCount,
      // 프레임
      frames:              payload.frames,
    })
    .eq("id", analysisId)

  if (error) throw new Error(`분석 레코드 업데이트 실패: ${error.message}`)
}

async function updateAnalysisFailed(analysisId: string, errorMsg: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from("analyses")
    .update({ status: "failed", error_msg: errorMsg })
    .eq("id", analysisId)
}

// ── 메인 분석 파이프라인 ──────────────────────────────────────────────────────

export async function runAnalysis(
  userId: string,
  url: string,
  platform: Platform,
): Promise<AnalysisResponse> {
  // 1. pending 레코드 생성
  const analysisId = await insertPendingAnalysis(userId, url, platform)

  try {
    // 2. Apify 크롤링
    const crawled = await crawlContent(url, platform)

    // 3. Apify 참여 지표 구성
    const engagementMetrics: EngagementMetrics = {
      likes:    crawled.likeCount    ?? 0,
      views:    crawled.viewCount    ?? 0,
      comments: crawled.commentCount ?? 0,
    }

    // 4. Gemini File API 영상 업로드 (멀티모달 분석용)
    const videoFile = crawled.videoUrl
      ? await uploadVideoForGemini(crawled.videoUrl, analysisId)
      : null

    // 5. Gemini 2단계 분석
    //    System1: 자유 분석 텍스트 생성 (음성 전사 포함)
    //    System2: JSON 구조화
    //    caption과 metrics는 context로만 전달, 반환값에서 제외
    const gemini = await analyzeContent(
      crawled.description ?? "",
      engagementMetrics,
      videoFile,
    )

    // 6. AnalysisResult 조립
    //    Gemini 결과 + Apify 데이터(caption, metrics)를 서비스 레이어에서 합성
    const analysisResult: AnalysisResult = {
      content_type:  gemini.content_type,
      hooking:       gemini.hooking,
      script:        gemini.script,
      caption:       crawled.description ?? "",   // Apify 직접 매핑
      production:    gemini.production,
      selling_point: gemini.selling_point,
      difficulty:    gemini.difficulty,
      engagement: {
        metrics:  engagementMetrics,               // Apify 직접 매핑
        analysis: gemini.engagement_analysis,
      },
    }

    // 7. 프레임 추출 및 Storage 업로드
    const frames: FrameData[] = crawled.videoUrl
      ? await extractAndUploadFrames(crawled.videoUrl, analysisId, userId)
      : buildPlaceholderFrames()

    if (frames.length > 0 && crawled.thumbnailUrl) {
      frames[0] = await uploadThumbnailFrame(crawled.thumbnailUrl, analysisId, userId, frames[0])
    }

    // 8. 타이틀 결정: script 첫 문장 → hooking 앞 40자 → caption 앞 40자 → platform 기본값
    const title =
      extractTitleFromScript(analysisResult.script) ||
      analysisResult.hooking.slice(0, 40).trim() ||
      extractTitleFromCaption(analysisResult.caption) ||
      `${platform} 콘텐츠`

    // 9. DB completed 업데이트
    await updateAnalysisCompleted(analysisId, {
      title,
      thumbnailUrl:  crawled.thumbnailUrl,
      postedAt:      crawled.postedAt,
      analysis:      analysisResult,
      frames,
      likeCount:     engagementMetrics.likes,
      viewCount:     engagementMetrics.views,
      commentCount:  engagementMetrics.comments,
    })

    // 10. 사용량 차감
    await incrementUsage(userId)

    return {
      id: analysisId,
      title,
      platform,
      url,
      thumbnailUrl: crawled.thumbnailUrl,
      analysis: analysisResult,
      frames,
      createdAt: new Date().toISOString(),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류"
    await updateAnalysisFailed(analysisId, msg)
    throw err
  }
}

export type { AnalysisStatus }
