import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"
import { refreshFrameSignedUrls } from "@/infrastructure/supabase/frame-url-refresher"
import { toContentCard } from "@/infrastructure/supabase/library-card-mapper"
import {
  buildLibrarySnapshot,
  type AnalysisDbRow,
} from "@/infrastructure/supabase/library-snapshot-builder"
import { PLAN_LIMITS } from "@/domains/billing/plan-limits"
import type { Plan } from "@/domains/billing/types"

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
    console.error("[Library GET] DB 오류:", error.message)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }

  const cards = await Promise.all(
    (data ?? []).map(async (row) => {
      const card = toContentCard(row as Record<string, unknown>)
      card.frames = await refreshFrameSignedUrls(card.frames)
      return card
    }),
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

  // 스냅샷 빌더로 INSERT 객체 생성 (단일 경로)
  const snapshot = buildLibrarySnapshot(user.id, analysis as unknown as AnalysisDbRow)

  const { data: card, error: insertError } = await supabase
    .from("library_cards")
    .insert(snapshot)
    .select()
    .single()

  if (insertError || !card) {
    console.error("[Library POST] INSERT 실패:", insertError?.message)
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 })
  }

  return NextResponse.json({
    card: toContentCard(card as Record<string, unknown>),
  })
}
