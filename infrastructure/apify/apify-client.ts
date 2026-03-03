import type { Platform } from "@/lib/types"

export interface ApifyResult {
  title: string
  description: string    // 캡션/해시태그
  thumbnailUrl?: string
  videoUrl?: string      // 영상 다운로드 URL (프레임 추출용)
  transcript?: string    // 자막 (있는 경우)
  duration?: number      // 영상 길이 (초)
  viewCount?: number
  likeCount?: number
  commentCount?: number  // 댓글 수 (engagement.metrics용)
}

// 인스타그램 릴스 전용 Actor ID (apify 공식, ~ 구분자 필수)
const INSTAGRAM_ACTOR_ID = "apify~instagram-reel-scraper"

export async function crawlContent(
  url: string,
  platform: Platform,
): Promise<ApifyResult> {
  // 인스타그램만 지원
  if (platform !== "instagram") {
    throw new Error(
      `${platform} 플랫폼은 현재 지원 준비 중입니다. 인스타그램 릴스 URL을 사용해주세요.`,
    )
  }

  const token = process.env.APIFY_API_TOKEN

  if (!token) {
    // API 키 없을 때 — URL에서 최소한의 정보만 추출
    return {
      title: `instagram 콘텐츠`,
      description: url,
    }
  }

  // Apify Actor 실행 (waitForFinish=120 → 최대 2분 대기)
  // instagram-reel-scraper의 입력 필드는 "username" (배열) — 릴스 URL도 허용
  const runRes = await fetch(
    `https://api.apify.com/v2/acts/${INSTAGRAM_ACTOR_ID}/runs?token=${token}&waitForFinish=120`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: [url],
        resultsLimit: 1,
      }),
    },
  )

  if (!runRes.ok) {
    const errText = await runRes.text().catch(() => "")
    throw new Error(`Apify Actor 실행 실패: ${runRes.status} ${errText}`)
  }

  const runData = await runRes.json()
  const datasetId = runData.data?.defaultDatasetId

  if (!datasetId) {
    throw new Error("Apify 데이터셋 ID 없음")
  }

  // 결과 조회
  const itemsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&limit=1`,
  )

  if (!itemsRes.ok) {
    throw new Error("Apify 결과 조회 실패")
  }

  const items: Record<string, unknown>[] = await itemsRes.json()
  const item = items[0]

  if (!item) {
    throw new Error("Apify 결과 없음 — URL이 올바른 인스타그램 릴스 주소인지 확인해주세요.")
  }

  return mapInstagramResult(item)
}

function mapInstagramResult(item: Record<string, unknown>): ApifyResult {
  const str = (v: unknown): string =>
    typeof v === "string" ? v : ""
  const num = (v: unknown): number | undefined =>
    typeof v === "number" ? v : undefined

  // caption에 hashtags 추가 (없으면 caption만)
  const caption = str(item.caption)
  const hashtags = Array.isArray(item.hashtags)
    ? (item.hashtags as string[]).map((h) => `#${h}`).join(" ")
    : ""
  const description = hashtags
    ? `${caption}\n\n${hashtags}`.trim()
    : caption

  return {
    // shortCode가 없으면 url, 없으면 id
    title: str(item.shortCode ?? item.url ?? item.id),
    description,
    thumbnailUrl: str(item.displayUrl) || undefined,
    videoUrl: str(item.videoUrl) || undefined,
    // transcript는 선택적 — 비어있으면 undefined
    transcript: str(item.transcript) || undefined,
    duration: num(item.videoDuration),
    // videoPlayCount가 더 정확한 수치, videoViewCount는 fallback
    viewCount: num(item.videoPlayCount ?? item.videoViewCount),
    likeCount: num(item.likesCount),
    commentCount: num(item.commentsCount),
  }
}
