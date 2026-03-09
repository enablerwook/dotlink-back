/**
 * Gemini 클라이언트 — 2단계 분석 시스템
 *
 * System1 (Analyst):   영상을 자유롭게 분석 → 자연어 텍스트
 * System2 (Structurer): System1 출력을 JSON으로 구조화
 *
 * SRP: 각 모델 팩토리와 호출 함수가 단일 책임을 가집니다.
 * - getAnalystModel(): 분석 전용 모델 (temperature 0.7, text/plain)
 * - getStructurerModel(): 구조화 전용 모델 (temperature 0, application/json)
 * - runSystem1(): 자유 분석 실행
 * - runSystem2(): JSON 구조화 실행
 * - analyzeContent(): 전체 2단계 파이프라인 조율
 */

import { GoogleGenerativeAI, type Part } from "@google/generative-ai"
import { GoogleAIFileManager } from "@google/generative-ai/server"
import { promises as fsPromises } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import type { DifficultyRating, EngagementMetrics } from "@/lib/types"
import {
  SYSTEM1_INSTRUCTION,
  SYSTEM2_INSTRUCTION,
  buildSystem1Prompt,
  buildSystem2Prompt,
} from "./prompts"

export interface GeminiAnalysisResult {
  content_type:        string
  hooking:             string
  script:              string
  production:          string
  engagement_analysis: string
  selling_point:       string
  difficulty:          DifficultyRating
}

export interface GeminiFileRef {
  fileUri: string
  mimeType: string
}

// ── API 키 ────────────────────────────────────────────────────────────────────

function getApiKey(): string {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요.")
  }
  return apiKey
}

// ── 모델 팩토리 (SRP: 각 모델은 단일 역할만) ──────────────────────────────────

/** System1 — 자유 분석 모델 (창의성 허용) */
function getAnalystModel() {
  const genAI = new GoogleGenerativeAI(getApiKey())
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM1_INSTRUCTION,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
    },
  })
}

/** System2 — 구조화 전용 모델 (결정적 출력) */
function getStructurerModel() {
  const genAI = new GoogleGenerativeAI(getApiKey())
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM2_INSTRUCTION,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0,
      maxOutputTokens: 4096,
    },
  })
}

// ── 재시도 유틸리티 ───────────────────────────────────────────────────────────

async function generateWithRetry(
  model: ReturnType<GoogleGenerativeAI["getGenerativeModel"]>,
  content: string | Part[],
  maxRetries = 3,
): Promise<string> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(content)
      const text = result.response.text()

      if (!text.trim()) {
        const candidate  = result.response.candidates?.[0]
        const finishReason   = candidate?.finishReason   ?? "없음"
        const blockReason    = result.response.promptFeedback?.blockReason ?? "없음"
        console.error("[Gemini] 빈 응답 진단 ▼")
        console.error("  finishReason :", finishReason)
        console.error("  blockReason  :", blockReason)
        console.error("  safetyRatings:", JSON.stringify(candidate?.safetyRatings ?? []))
        throw new Error(`Gemini 빈 응답 — finishReason: ${finishReason}, blockReason: ${blockReason}`)
      }

      return text
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const is429 = message.includes("429") || message.includes("Too Many Requests")
      const is5xx = message.includes("500") || message.includes("503") || message.includes("Service Unavailable")

      if ((!is429 && !is5xx) || attempt === maxRetries) throw err

      const delayMatch = message.match(/"retryDelay"\s*:\s*"(\d+)s"/)
      const waitMs = delayMatch
        ? parseInt(delayMatch[1], 10) * 1000
        : Math.min(2 ** attempt * 5000, 60000)

      await new Promise((res) => setTimeout(res, waitMs))
    }
  }
  throw new Error("Gemini 재시도 횟수 초과")
}

// ── JSON 파서 ─────────────────────────────────────────────────────────────────

function parseStructuredJson(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const normalized = cleaned.replace(/\r?\n/g, " ")
    try {
      return JSON.parse(normalized)
    } catch {
      console.error("[Gemini System2] JSON 파싱 실패:", cleaned.slice(0, 200))
      throw new Error("Gemini 구조화 응답을 파싱할 수 없습니다. 잠시 후 다시 시도해주세요.")
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
    const res = await fetch(videoUrl)
    if (!res.ok) throw new Error(`영상 다운로드 실패: ${res.status}`)

    const buffer = await res.arrayBuffer()
    await fsPromises.writeFile(tmpPath, Buffer.from(buffer))

    const fileManager = new GoogleAIFileManager(getApiKey())
    const uploadResult = await fileManager.uploadFile(tmpPath, {
      mimeType: "video/mp4",
      displayName: `analysis_${analysisId}`,
    })

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
    await fsPromises.unlink(tmpPath).catch(() => {})
  }
}

// ── System1 실행 — 자유 분석 ─────────────────────────────────────────────────

async function runSystem1(
  caption: string,
  metrics: EngagementMetrics,
  videoFile: GeminiFileRef | null,
): Promise<string> {
  const model = getAnalystModel()
  const prompt = buildSystem1Prompt(caption, metrics, !!videoFile)

  const content: string | Part[] = videoFile
    ? [
        { fileData: { fileUri: videoFile.fileUri, mimeType: videoFile.mimeType } },
        { text: prompt },
      ]
    : prompt

  const analysisText = await generateWithRetry(model, content)
  console.log("[Gemini System1] 자유 분석 완료 — 길이:", analysisText.length)
  return analysisText
}

// ── System2 실행 — JSON 구조화 ────────────────────────────────────────────────

async function runSystem2(system1Output: string): Promise<GeminiAnalysisResult> {
  const model = getStructurerModel()
  const prompt = buildSystem2Prompt(system1Output)
  const text = await generateWithRetry(model, prompt)
  const parsed = parseStructuredJson(text)

  // 필수 필드 검증 — Fail Fast
  const REQUIRED: Array<keyof GeminiAnalysisResult> = ["content_type", "hooking", "script"]
  const missing = REQUIRED.filter((f) => !parsed[f])
  if (missing.length === REQUIRED.length) {
    throw new Error("Gemini 구조화 결과에 필수 필드가 없습니다.")
  }

  const diff = (parsed.difficulty ?? {}) as Record<string, unknown>

  return {
    content_type:        String(parsed.content_type        ?? ""),
    hooking:             String(parsed.hooking             ?? ""),
    script:              String(parsed.script              ?? ""),
    production:          String(parsed.production          ?? ""),
    engagement_analysis: String(parsed.engagement_analysis ?? ""),
    selling_point:       String(parsed.selling_point       ?? ""),
    difficulty: {
      planning: Number(diff.planning ?? 3),
      filming:  Number(diff.filming  ?? 3),
      editing:  Number(diff.editing  ?? 3),
    },
  }
}

// ── 공개 인터페이스 — 2단계 파이프라인 조율 ──────────────────────────────────

/**
 * 영상을 2단계로 분석합니다.
 *
 * caption과 metrics는 Apify에서 직접 전달받아 컨텍스트로만 활용합니다.
 * 반환값은 Gemini가 생성한 7개 필드만 포함합니다 (caption/metrics 제외).
 */
export async function analyzeContent(
  caption: string,
  metrics: EngagementMetrics,
  videoFile?: GeminiFileRef | null,
): Promise<GeminiAnalysisResult> {
  const analysis1 = await runSystem1(caption, metrics, videoFile ?? null)
  const result    = await runSystem2(analysis1)
  return result
}
