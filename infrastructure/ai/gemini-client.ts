import { GoogleGenerativeAI, type Part } from "@google/generative-ai"
import { GoogleAIFileManager } from "@google/generative-ai/server"
import { promises as fsPromises } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { DifficultyRating, EngagementMetrics } from "@/lib/types"
import { SYSTEM_INSTRUCTION, buildAnalysisPrompt } from "./prompts"

export interface GeminiAnalysisResult {
  content_type: string
  hook_analysis: string
  production_note: string
  engagement_analysis: string
  selling_point: string
  difficulty: DifficultyRating
}

export interface GeminiFileRef {
  fileUri: string
  mimeType: string
}

// ── Gemini 모델 팩토리 ────────────────────────────────────────────────────────

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요.")
  }
  return apiKey
}

function getModel() {
  const genAI = new GoogleGenerativeAI(getApiKey())
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 8192,
    },
  })
}

// ── 공통 유틸리티 ─────────────────────────────────────────────────────────────

async function generateWithRetry(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  content: string | Part[],
  maxRetries = 3,
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(content)
      return result.response.text()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const is429 = message.includes("429") || message.includes("Too Many Requests")

      if (!is429 || attempt === maxRetries) throw err

      const delayMatch = message.match(/"retryDelay"\s*:\s*"(\d+)s"/)
      const waitMs = delayMatch
        ? parseInt(delayMatch[1], 10) * 1000
        : Math.min(2 ** attempt * 5000, 60000)

      await new Promise((res) => setTimeout(res, waitMs))
    }
  }
  throw new Error("Gemini 재시도 횟수 초과")
}

// responseMimeType: "application/json" 설정으로 항상 유효한 JSON이 반환되지만
// 예외 상황 대비용 폴백 파서 유지
function parseJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim()

  // 1차 시도: 그대로 파싱
  try {
    return JSON.parse(cleaned)
  } catch {
    // 2차·3차 시도는 정규화 버전 기준으로 진행
    const normalized = cleaned.replace(/\r?\n/g, " ")

    // 2차 시도: 개행문자 정규화 후 파싱
    try {
      return JSON.parse(normalized)
    } catch {
      // 3차 시도: 잘린 JSON 복구 — 정규화 버전에서 마지막 미완성 문자열 닫기
      try {
        const recovered = normalized.replace(/,?\s*$/, "") + '"}'
        return JSON.parse(recovered)
      } catch {
        console.error("[Gemini] JSON 파싱 실패 — fallback {}:", cleaned.slice(0, 150))
        return {}
      }
    }
  }
}

// ── Gemini File API 영상 업로드 ───────────────────────────────────────────────

export async function uploadVideoForGemini(
  videoUrl: string,
  analysisId: string,
): Promise<GeminiFileRef | null> {
  const tmpPath = join(tmpdir(), `gemini_video_${analysisId}.mp4`)

  try {
    // 1. 영상 다운로드 → 임시 파일 저장
    const res = await fetch(videoUrl)
    if (!res.ok) throw new Error(`영상 다운로드 실패: ${res.status}`)

    const buffer = await res.arrayBuffer()
    await fsPromises.writeFile(tmpPath, Buffer.from(buffer))

    // 2. Gemini File API 업로드
    const fileManager = new GoogleAIFileManager(getApiKey())
    const uploadResult = await fileManager.uploadFile(tmpPath, {
      mimeType: "video/mp4",
      displayName: `analysis_${analysisId}`,
    })

    // 3. ACTIVE 상태 대기 (PROCESSING → ACTIVE)
    let file = uploadResult.file
    while (file.state === "PROCESSING") {
      await new Promise((res) => setTimeout(res, 2000))
      file = await fileManager.getFile(file.name)
    }

    if (file.state !== "ACTIVE") {
      throw new Error(`Gemini 파일 처리 실패: ${file.state}`)
    }

    console.log(`[Gemini] 영상 업로드 완료: ${file.uri}`)
    return { fileUri: file.uri, mimeType: file.mimeType }
  } catch (err) {
    console.error("[Gemini] 영상 업로드 실패 — 텍스트 전용 분석으로 대체:", err)
    return null
  } finally {
    // 4. 임시 파일 삭제
    await fsPromises.unlink(tmpPath).catch(() => {})
  }
}

// ── 통합 분석 (1회 호출) ──────────────────────────────────────────────────────

// Gemini가 간혹 string 대신 object로 반환하는 경우를 안전하게 처리
// (예: engagement_analysis 5개 서브항목을 객체로 반환)
function toStr(v: unknown): string {
  if (typeof v === "string") return v
  if (v === null || v === undefined) return ""
  if (typeof v === "object" && !Array.isArray(v)) {
    // 객체 값들을 빈줄 구분으로 이어붙여 하나의 텍스트로
    return Object.values(v as Record<string, unknown>)
      .map(String)
      .filter(Boolean)
      .join("\n\n")
  }
  return String(v)
}

export async function analyzeContent(
  script: string,
  caption: string,
  metrics: EngagementMetrics,
  videoFile?: GeminiFileRef | null,
): Promise<GeminiAnalysisResult> {
  const model = getModel()
  const prompt = buildAnalysisPrompt(script, caption, metrics, !!videoFile)

  // 멀티모달(영상+텍스트) 또는 텍스트 전용으로 분기
  const content: string | Part[] = videoFile
    ? [
        { fileData: { fileUri: videoFile.fileUri, mimeType: videoFile.mimeType } },
        { text: prompt },
      ]
    : prompt

  const text = await generateWithRetry(model, content)
  const parsed = parseJson(text)

  const diff = (parsed.difficulty ?? {}) as Record<string, unknown>

  return {
    content_type:        toStr(parsed.content_type),
    hook_analysis:       toStr(parsed.hook_analysis),
    production_note:     toStr(parsed.production_note),
    engagement_analysis: toStr(parsed.engagement_analysis),
    selling_point:       toStr(parsed.selling_point),
    difficulty: {
      planning: Number(diff.planning ?? 3),
      filming:  Number(diff.filming  ?? 3),
      editing:  Number(diff.editing  ?? 3),
    },
  }
}
