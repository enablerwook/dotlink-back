import type { Platform, FrameData, AnalysisResult, EngagementMetrics } from "@/lib/types"
import type { AnalysisStatus } from "./types"
import { crawlContent } from "@/infrastructure/apify/apify-client"
import { analyzeContent, uploadVideoForGemini } from "@/infrastructure/ai/gemini-client"
import { transcribeAudio } from "@/infrastructure/ai/whisper-client"
import { createClient } from "@/infrastructure/supabase/server"
import {
  extractAndUploadFrames,
  buildPlaceholderFrames,
  uploadThumbnailFrame,
} from "@/infrastructure/video/frame-extractor"

export interface AnalysisResponse {
  id: string
  title: string
  platform: Platform
  url: string
  thumbnailUrl?: string
  analysis: AnalysisResult
  frames: FrameData[]
  tags: string[]
  createdAt: string
}

// 플랫폼 URL 유효성 검증
export function detectPlatform(url: string): Platform | null {
  if (url.includes("instagram.com")) return "instagram"
  if (url.includes("tiktok.com")) return "tiktok"
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube"
  return null
}

// 캡션에서 해시태그 추출
function extractTags(caption: string): string[] {
  const matches = caption.match(/#[^\s#]+/g) ?? []
  return matches.slice(0, 10)
}

// DB에서 이번 달 사용량 조회
export async function getMonthlyUsage(userId: string): Promise<number> {
  const supabase = await createClient()
  const yearMonth = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

  const { data } = await supabase
    .from("usage_records")
    .select("analysis_count")
    .eq("user_id", userId)
    .eq("year_month", yearMonth)
    .single()

  return data?.analysis_count ?? 0
}

// 사용량 +1 차감
async function incrementUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  const yearMonth = new Date().toISOString().slice(0, 7)

  await supabase.from("usage_records").upsert(
    {
      user_id: userId,
      year_month: yearMonth,
      analysis_count: 1,
    },
    {
      onConflict: "user_id,year_month",
      ignoreDuplicates: false,
    },
  )

  await supabase.rpc("increment_analysis_count", {
    p_user_id: userId,
    p_year_month: yearMonth,
  })
}

// 분석 레코드 pending 삽입
async function insertPendingAnalysis(
  userId: string,
  url: string,
  platform: Platform,
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("analyses")
    .insert({
      user_id: userId,
      url,
      platform,
      status: "pending",
    })
    .select("id")
    .single()

  if (error || !data) {
    throw new Error("분석 레코드 생성 실패")
  }

  return data.id
}

// 분석 레코드 completed 업데이트
async function updateAnalysisCompleted(
  analysisId: string,
  {
    title,
    thumbnail,
    scores,
    frames,
  }: {
    title: string
    thumbnail?: string
    scores: AnalysisResult
    frames: FrameData[]
  },
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("analyses")
    .update({
      status: "completed",
      title,
      thumbnail,
      scores,
      frames,
    })
    .eq("id", analysisId)

  if (error) {
    throw new Error(`분석 레코드 업데이트 실패: ${error.message}`)
  }
}

// 분석 레코드 failed 업데이트
async function updateAnalysisFailed(
  analysisId: string,
  errorMsg: string,
): Promise<void> {
  const supabase = await createClient()

  await supabase
    .from("analyses")
    .update({ status: "failed", error_msg: errorMsg })
    .eq("id", analysisId)
}

// ── 메인 분석 파이프라인 ──────────────────────────────────────────────────────────
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

    const caption = crawled.description

    // 3. Whisper STT — full_script: 전체 대본, hook_text: 첫 5초 발화 텍스트
    const { full_script, hook_text } = crawled.videoUrl
      ? await transcribeAudio(crawled.videoUrl, analysisId)
      : { full_script: "", hook_text: "" }

    // 4. Apify engagement metrics 구성 (공유수/저장수 미제공 — 트래킹 제외)
    const engagementMetrics: EngagementMetrics = {
      likes:    crawled.likeCount    ?? 0,
      views:    crawled.viewCount    ?? 0,
      comments: crawled.commentCount ?? 0,
    }

    // 5. Gemini 영상 업로드 (videoUrl이 있을 경우 멀티모달 분석, 없으면 텍스트 전용)
    const videoFile = crawled.videoUrl
      ? await uploadVideoForGemini(crawled.videoUrl, analysisId)
      : null

    // 6. Gemini 통합 분석 (1회 호출로 5개 차원 동시 분석)
    const gemini = await analyzeContent(full_script, caption, engagementMetrics, videoFile)

    // 6. AnalysisResult 조립
    const analysisResult: AnalysisResult = {
      hook_analysis:   gemini.hook_analysis,
      hook_text,
      full_script,
      caption,
      production_note: gemini.production_note,
      engagement: {
        metrics:  engagementMetrics,
        analysis: gemini.engagement_analysis,
      },
      content_type:  gemini.content_type,
      selling_point: gemini.selling_point,
      difficulty:    gemini.difficulty,
    }

    // 7. 프레임 추출 — DB 저장 전에 수행
    const frames: FrameData[] = crawled.videoUrl
      ? await extractAndUploadFrames(crawled.videoUrl, analysisId)
      : buildPlaceholderFrames()

    // frame 0은 항상 Apify thumbnailUrl → Supabase Storage 업로드 후 안정적 URL 사용
    if (frames.length > 0 && crawled.thumbnailUrl) {
      frames[0] = await uploadThumbnailFrame(crawled.thumbnailUrl, analysisId, frames[0])
    }

    // 8. DB completed 업데이트
    await updateAnalysisCompleted(analysisId, {
      title: crawled.title,
      thumbnail: crawled.thumbnailUrl,
      scores: analysisResult,
      frames,
    })

    // 9. 사용량 차감
    await incrementUsage(userId)

    return {
      id: analysisId,
      title: crawled.title || `${platform} 콘텐츠`,
      platform,
      url,
      thumbnailUrl: crawled.thumbnailUrl,
      analysis: analysisResult,
      frames,
      tags: extractTags(caption),
      createdAt: new Date().toISOString(),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "알 수 없는 오류"
    await updateAnalysisFailed(analysisId, msg)
    throw err
  }
}

export type { AnalysisStatus }
