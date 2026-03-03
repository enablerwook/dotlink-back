/**
 * OpenAI Whisper STT 클라이언트
 *
 * 파이프라인:
 *   videoUrl → ffmpeg 오디오 추출(MP3) → Whisper API(verbose_json) → { full_script, hook_text }
 *
 * - full_script: 전체 전사 텍스트
 * - hook_text:   첫 5초(~150프레임) 이내 발화 텍스트
 * - 실패 시 두 필드 모두 "" 반환 (파이프라인 중단 없음)
 */

import { promises as fs } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import ffmpeg from "fluent-ffmpeg"
import ffmpegPath from "ffmpeg-static"
import OpenAI from "openai"

if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

// 오디오 파일 크기 상한 (Whisper API: 25MB)
const MAX_AUDIO_SIZE_BYTES = 24 * 1024 * 1024 // 24MB (여유)

// hook_text 추출 기준 — 첫 5초 (30fps 기준 150프레임)
const HOOK_DURATION_SEC = 5.0

/** Whisper verbose_json 세그먼트 타입 */
interface WhisperSegment {
  start: number
  end: number
  text: string
}

/** Whisper verbose_json 응답 타입 */
interface WhisperVerboseResult {
  text: string
  segments?: WhisperSegment[]
}

/** videoUrl에서 오디오(MP3)를 추출하여 임시 파일에 저장 */
function extractAudio(videoUrl: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      .inputOptions(["-ss 0"])        // 처음부터
      .outputOptions([
        "-vn",                        // 비디오 스트림 제거
        "-acodec libmp3lame",         // MP3 인코딩
        "-ar 16000",                  // 16kHz (Whisper 최적)
        "-ac 1",                      // 모노
        "-b:a 64k",                   // 비트레이트 낮춰서 파일 크기 절감
        "-t 300",                     // 최대 5분까지만 추출
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run()
  })
}

/**
 * videoUrl의 음성을 텍스트로 변환하여 반환합니다.
 *
 * @param videoUrl   Apify가 반환한 영상 CDN URL
 * @param analysisId 임시 파일 구분자
 * @returns { full_script: 전체 대본, hook_text: 첫 5초 발화 텍스트 } — 실패 시 두 필드 모두 ""
 */
export async function transcribeAudio(
  videoUrl: string,
  analysisId: string,
): Promise<{ full_script: string; hook_text: string }> {
  const empty = { full_script: "", hook_text: "" }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.warn("[Whisper] OPENAI_API_KEY 없음 — full_script/hook_text 비어있음으로 처리")
    return empty
  }

  const audioPath = join(tmpdir(), `dotlink-audio-${analysisId}.mp3`)

  try {
    // 1. 오디오 추출
    await extractAudio(videoUrl, audioPath)

    // 2. 파일 크기 확인 (25MB 초과 시 skip)
    const stat = await fs.stat(audioPath)
    if (stat.size > MAX_AUDIO_SIZE_BYTES) {
      console.warn(`[Whisper] 오디오 크기 초과 (${stat.size} bytes) — skip`)
      return empty
    }

    // 3. Whisper API 전송 — verbose_json으로 타임스탬프 세그먼트 수신
    const client = new OpenAI({ apiKey })
    const audioFile = await fs.readFile(audioPath)

    const transcription = await client.audio.transcriptions.create({
      model: "whisper-1",
      file: new File([audioFile], "audio.mp3", { type: "audio/mpeg" }),
      // language 미지정 → Whisper가 오디오 언어 자동 감지 후 해당 언어 그대로 전사
      // (language: "ko" 고정 시 영어 콘텐츠가 한국어로 번역되는 문제 발생)
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })

    // verbose_json 응답 파싱
    const verbose = transcription as unknown as WhisperVerboseResult
    const segments: WhisperSegment[] = verbose.segments ?? []

    // 전체 대본 — 모든 세그먼트 텍스트 합산
    const full_script = segments.length > 0
      ? segments.map((s) => s.text.trim()).join(" ").trim()
      : (verbose.text ?? "").trim()

    // 후킹 텍스트 — 첫 5초(HOOK_DURATION_SEC) 이내 세그먼트만 추출
    const hook_text = segments
      .filter((s) => s.start < HOOK_DURATION_SEC)
      .map((s) => s.text.trim())
      .join(" ")
      .trim()

    return { full_script, hook_text }
  } catch (err) {
    console.error("[Whisper] 음성 변환 실패:", err instanceof Error ? err.message : err)
    return empty
  } finally {
    // 임시 파일 정리
    await fs.rm(audioPath, { force: true }).catch(() => {})
  }
}
