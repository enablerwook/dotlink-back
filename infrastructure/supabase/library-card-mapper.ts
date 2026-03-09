/**
 * 라이브러리 카드 매퍼
 *
 * 단일 책임: library_cards DB row → ContentCard 도메인 타입 변환
 *
 * - 순수 함수: 사이드이펙트 없음
 * - EngagementData 조립: like_count/view_count/comment_count + engagement_analysis
 * - frames 서명 URL 갱신은 이 mapper 밖에서 처리 (SRP 분리)
 */

import type { ContentCard, FrameData, DifficultyRating } from "@/lib/types"

const THUMBNAIL_GRADIENTS = [
  "from-blue-600 to-violet-600",
  "from-rose-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-yellow-400",
  "from-cyan-500 to-blue-500",
  "from-pink-500 to-fuchsia-500",
]

const FRAME_GRADIENTS = [
  "from-slate-700 to-slate-900", "from-zinc-700 to-zinc-900",
  "from-neutral-700 to-neutral-800", "from-stone-700 to-stone-900",
  "from-gray-700 to-gray-900", "from-red-800 to-red-950",
  "from-orange-800 to-orange-950", "from-amber-800 to-amber-950",
  "from-yellow-800 to-yellow-950", "from-lime-800 to-lime-950",
  "from-green-800 to-green-950", "from-teal-800 to-teal-950",
  "from-cyan-800 to-cyan-950", "from-sky-800 to-sky-950",
  "from-blue-800 to-blue-950", "from-violet-800 to-violet-950",
]

const DEFAULT_DIFFICULTY: DifficultyRating = { planning: 3, filming: 3, editing: 3 }

function pickGradient(id: string): string {
  const idx = id.charCodeAt(0) % THUMBNAIL_GRADIENTS.length
  return THUMBNAIL_GRADIENTS[idx]
}

function toLocaleDateString(createdAt: unknown): string {
  if (typeof createdAt !== "string") return ""
  return new Date(createdAt).toLocaleDateString("ko-KR")
}

function toFrameData(rawFrames: unknown): FrameData[] {
  if (Array.isArray(rawFrames) && rawFrames.length > 0) {
    return rawFrames as FrameData[]
  }
  return FRAME_GRADIENTS.map((gradient, i) => {
    const ts = Math.round(i * 0.5 * 10) / 10
    return { id: i + 1, gradient, label: `${ts.toFixed(1)}s`, timestamp: ts }
  })
}

function toDifficultyRating(raw: unknown): DifficultyRating {
  if (!raw || typeof raw !== "object") return DEFAULT_DIFFICULTY
  const d = raw as Record<string, unknown>
  return {
    planning: typeof d.planning === "number" ? d.planning : 3,
    filming:  typeof d.filming  === "number" ? d.filming  : 3,
    editing:  typeof d.editing  === "number" ? d.editing  : 3,
  }
}

/**
 * library_cards DB row를 ContentCard 도메인 타입으로 변환합니다.
 * 순수 함수: 입력이 같으면 항상 같은 결과를 반환합니다.
 */
export function toContentCard(row: Record<string, unknown>): ContentCard {
  return {
    id:               String(row.id    ?? ""),
    title:            String(row.title ?? ""),
    platform:         row.platform as ContentCard["platform"],
    url:              String(row.url   ?? ""),
    thumbnailGradient: pickGradient(String(row.id ?? "")),
    postedAt:         typeof row.posted_at === "string" ? new Date(row.posted_at).toLocaleDateString("ko-KR") : undefined,
    dateAnalyzed:     toLocaleDateString(row.created_at),
    frames:           toFrameData(row.frames),
    analysis: {
      content_type:  String(row.content_type  ?? ""),
      hooking:       String(row.hooking       ?? ""),
      script:        String(row.script        ?? ""),
      caption:       String(row.caption       ?? ""),
      production:    String(row.production    ?? ""),
      selling_point: String(row.selling_point ?? ""),
      difficulty:    toDifficultyRating(row.difficulty),
      engagement: {
        metrics: {
          views:    typeof row.view_count    === "number" ? row.view_count    : 0,
          likes:    typeof row.like_count    === "number" ? row.like_count    : 0,
          comments: typeof row.comment_count === "number" ? row.comment_count : 0,
        },
        analysis: String(row.engagement_analysis ?? ""),
      },
    },
  }
}
