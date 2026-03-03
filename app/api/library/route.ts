import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"
import type { ContentCard, FrameData } from "@/lib/types"
import type { AnalysisResult } from "@/domains/analysis/types"
import { PLAN_LIMITS } from "@/domains/billing/plan-limits"
import type { Plan } from "@/domains/billing/types"

const THUMBNAIL_GRADIENTS = [
  "from-blue-600 to-violet-600",
  "from-rose-500 to-orange-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-yellow-400",
  "from-cyan-500 to-blue-500",
  "from-pink-500 to-fuchsia-500",
]

function pickGradient(id: string): string {
  const idx = id.charCodeAt(0) % THUMBNAIL_GRADIENTS.length
  return THUMBNAIL_GRADIENTS[idx]
}

// 라이브러리 카드용 플레이스홀더 프레임 (16장)
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

function generatePlaceholderFrames(): FrameData[] {
  return FRAME_GRADIENTS.map((gradient, i) => {
    const ts = Math.round(i * 0.5 * 10) / 10
    return {
      id: i + 1,
      gradient,
      label: `${ts.toFixed(1)}s`,
      timestamp: ts,
    }
  })
}

function dbRowToContentCard(row: Record<string, unknown>): ContentCard {
  const scores = (row.scores ?? {}) as AnalysisResult
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : []
  const date = typeof row.created_at === "string"
    ? new Date(row.created_at).toLocaleDateString("ko-KR")
    : ""

  // DB에 저장된 frames 사용, 없으면 플레이스홀더 fallback
  const frames = Array.isArray(row.frames) && row.frames.length > 0
    ? (row.frames as FrameData[])
    : generatePlaceholderFrames()

  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    platform: row.platform as ContentCard["platform"],
    url: String(row.url ?? ""),
    thumbnailGradient: pickGradient(String(row.id ?? "")),
    dateAnalyzed: date,
    frames,
    analysis: scores,
    tags,
  }
}

// GET /api/library — 라이브러리 카드 목록 조회
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("library_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const cards = (data ?? []).map((row) =>
    dbRowToContentCard(row as Record<string, unknown>),
  )

  return NextResponse.json({ cards })
}

// POST /api/library — 분석 결과를 라이브러리에 저장
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  let body: { analysisId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 })
  }

  if (!body.analysisId) {
    return NextResponse.json({ error: "analysisId가 필요합니다." }, { status: 400 })
  }

  // 플랜 한도 체크
  const { data: userData } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single()

  const plan = (userData?.plan ?? "starter") as Plan
  const limit = PLAN_LIMITS[plan].libraryCards

  if (limit !== Infinity) {
    const { count } = await supabase
      .from("library_cards")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)

    if ((count ?? 0) >= limit) {
      return NextResponse.json(
        {
          error: `라이브러리 한도(${limit}개)를 초과했습니다. 플랜을 업그레이드하세요.`,
          code: "LIBRARY_LIMIT_EXCEEDED",
        },
        { status: 403 },
      )
    }
  }

  // 분석 결과 조회
  const { data: analysis, error: analysisError } = await supabase
    .from("analyses")
    .select("*")
    .eq("id", body.analysisId)
    .eq("user_id", user.id)
    .single()

  if (analysisError || !analysis) {
    return NextResponse.json({ error: "분석 결과를 찾을 수 없습니다." }, { status: 404 })
  }

  if (analysis.status !== "completed") {
    return NextResponse.json({ error: "분석이 완료되지 않았습니다." }, { status: 400 })
  }

  // 이미 저장된 카드인지 확인
  const { data: existing } = await supabase
    .from("library_cards")
    .select("id")
    .eq("user_id", user.id)
    .eq("analysis_id", body.analysisId)
    .single()

  if (existing) {
    return NextResponse.json({ error: "이미 라이브러리에 저장된 콘텐츠입니다." }, { status: 409 })
  }

  // 라이브러리 카드 생성
  const { data: card, error: insertError } = await supabase
    .from("library_cards")
    .insert({
      user_id: user.id,
      analysis_id: body.analysisId,
      title: analysis.title ?? `${analysis.platform} 콘텐츠`,
      platform: analysis.platform,
      url: analysis.url,
      thumbnail: analysis.thumbnail ?? null,
      scores: analysis.scores,
      // analyses 테이블에 저장된 frames 복사 (Storage 이미지 URL 포함)
      frames: analysis.frames ?? [],
      tags: [],
    })
    .select()
    .single()

  if (insertError || !card) {
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 })
  }

  return NextResponse.json({
    card: dbRowToContentCard(card as Record<string, unknown>),
  })
}
