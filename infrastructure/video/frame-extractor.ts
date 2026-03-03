import { promises as fs } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import ffmpeg from "fluent-ffmpeg"
import ffmpegPath from "ffmpeg-static"
import { createClient } from "@/infrastructure/supabase/server"
import type { FrameData } from "@/lib/types"

// ffmpeg 바이너리 경로 설정
if (ffmpegPath) {
  ffmpeg.setFfmpegPath(ffmpegPath)
}

// 30fps 기준 0.5초(15프레임) 간격으로 16장 추출 → 0초~7.5초
const FRAME_COUNT = 16
const FRAME_INTERVAL_SEC = 0.5

// 16장 플레이스홀더용 그라디언트 (imageUrl 없을 때 fallback)
const FALLBACK_GRADIENTS: string[] = [
  "from-slate-700 to-slate-900",
  "from-zinc-700 to-zinc-900",
  "from-neutral-700 to-neutral-800",
  "from-stone-700 to-stone-900",
  "from-gray-700 to-gray-900",
  "from-red-800 to-red-950",
  "from-orange-800 to-orange-950",
  "from-amber-800 to-amber-950",
  "from-yellow-800 to-yellow-950",
  "from-lime-800 to-lime-950",
  "from-green-800 to-green-950",
  "from-teal-800 to-teal-950",
  "from-cyan-800 to-cyan-950",
  "from-sky-800 to-sky-950",
  "from-blue-800 to-blue-950",
  "from-violet-800 to-violet-950",
]

/** 단일 프레임 추출 — ffmpeg로 특정 타임스탬프의 1장을 JPEG로 저장 */
function extractSingleFrame(
  videoUrl: string,
  outputPath: string,
  timestampSec: number,
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoUrl)
      // -ss를 input 옵션으로 사용 (빠른 키프레임 탐색)
      .inputOptions([`-ss ${timestampSec}`])
      .outputOptions([
        "-vframes 1",     // 정확히 1장만 추출
        "-q:v 3",         // JPEG 품질 (1=최고, 31=최저)
        "-vf scale=720:-1", // 가로 720px, 세로 비율 유지
      ])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err) => reject(err))
      .run()
  })
}

/**
 * 영상 URL에서 0.5초 간격으로 16장(0초~7.5초)을 추출하고
 * Supabase Storage `frames/{analysisId}/frame-{n}.jpg`에 업로드합니다.
 *
 * - 개별 프레임 실패 시: 해당 프레임만 플레이스홀더로 fallback (파이프라인 중단 없음)
 * - 전체 실패 시: 16장 플레이스홀더 배열 반환
 */
export async function extractAndUploadFrames(
  videoUrl: string,
  analysisId: string,
): Promise<FrameData[]> {
  const tmpDir = join(tmpdir(), `dotlink-frames-${analysisId}`)

  // 타임스탬프 생성: 0, 0.5, 1.0, 1.5, ..., 7.5 (총 16개)
  const timestamps = Array.from(
    { length: FRAME_COUNT },
    (_, i) => Math.round(i * FRAME_INTERVAL_SEC * 10) / 10, // 부동소수점 오차 방지
  )

  try {
    await fs.mkdir(tmpDir, { recursive: true })

    const supabase = await createClient()
    const frames: FrameData[] = []

    for (let i = 0; i < FRAME_COUNT; i++) {
      const ts = timestamps[i]
      const localPath = join(tmpDir, `frame-${i}.jpg`)
      const storagePath = `${analysisId}/frame-${i}.jpg`

      try {
        // 1) ffmpeg로 해당 타임스탬프 프레임 추출
        await extractSingleFrame(videoUrl, localPath, ts)

        // 2) 추출된 파일 읽기
        const buffer = await fs.readFile(localPath)

        // 3) Supabase Storage 업로드
        const { error } = await supabase.storage
          .from("frames")
          .upload(storagePath, buffer, {
            contentType: "image/jpeg",
            upsert: true,
          })

        if (error) throw error

        // 4) 공개 URL 획득
        const { data: urlData } = supabase.storage
          .from("frames")
          .getPublicUrl(storagePath)

        frames.push({
          id: i + 1,
          imageUrl: urlData.publicUrl,
          timestamp: ts,
          gradient: FALLBACK_GRADIENTS[i],
          label: `${ts.toFixed(1)}s`,
        })
      } catch {
        // 해당 프레임만 실패 → 플레이스홀더
        frames.push({
          id: i + 1,
          timestamp: ts,
          gradient: FALLBACK_GRADIENTS[i],
          label: `${ts.toFixed(1)}s`,
        })
      }
    }

    return frames
  } catch {
    // 전체 실패 → 16장 플레이스홀더
    return buildPlaceholderFrames()
  } finally {
    // 임시 디렉토리 정리
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {})
  }
}

/**
 * Apify thumbnailUrl(Instagram CDN)을 Supabase Storage에 업로드하여
 * 만료 걱정 없는 안정적인 URL로 변환합니다.
 * 업로드 실패 시 원본 CDN URL을 직접 fallback으로 사용합니다.
 */
export async function uploadThumbnailFrame(
  thumbnailUrl: string,
  analysisId: string,
  existingFrame: FrameData,
): Promise<FrameData> {
  // frame-0.jpg는 ffmpeg가 먼저 INSERT할 수 있으므로 별도 경로 사용 (UPDATE RLS 방지)
  const storagePath = `${analysisId}/thumbnail.jpg`

  try {
    // Instagram CDN은 브라우저처럼 보이는 헤더 없이 서버 fetch 시 403/400 차단
    const res = await fetch(thumbnailUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.instagram.com/",
        "Sec-Fetch-Dest": "image",
        "Sec-Fetch-Mode": "no-cors",
        "Sec-Fetch-Site": "cross-site",
      },
    })
    if (!res.ok) throw new Error(`thumbnail fetch ${res.status}`)

    const buffer = Buffer.from(await res.arrayBuffer())
    const supabase = await createClient()

    const { error } = await supabase.storage
      .from("frames")
      .upload(storagePath, buffer, { contentType: "image/jpeg", upsert: true })

    if (error) throw error

    const { data: urlData } = supabase.storage
      .from("frames")
      .getPublicUrl(storagePath)

    console.log("[frame] thumbnail → Supabase Storage 업로드 완료:", urlData.publicUrl)
    return { ...existingFrame, imageUrl: urlData.publicUrl }
  } catch (err) {
    // Supabase 업로드 실패 시 원본 CDN URL 직접 사용 (단기 fallback)
    console.warn("[frame] thumbnail 업로드 실패, CDN URL fallback:", err)
    return { ...existingFrame, imageUrl: thumbnailUrl }
  }
}

/** 플레이스홀더 16장 (videoUrl 없거나 전체 실패 시 fallback) */
export function buildPlaceholderFrames(): FrameData[] {
  return Array.from({ length: FRAME_COUNT }, (_, i) => {
    const ts = Math.round(i * FRAME_INTERVAL_SEC * 10) / 10
    return {
      id: i + 1,
      timestamp: ts,
      gradient: FALLBACK_GRADIENTS[i],
      label: `${ts.toFixed(1)}s`,
    }
  })
}
