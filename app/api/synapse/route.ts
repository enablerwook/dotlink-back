import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"

interface CreationCardBody {
  cardAId?: string
  cardBId?: string
  hookingPoint?: string
  contentStructure?: string
  differentiation?: string
  keywords?: string[]
  aiInsights?: string
  draft?: string
}

// GET /api/synapse — Creation Card 목록 조회
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("creation_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ cards: data ?? [] })
}

// POST /api/synapse — Creation Card 저장
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  let body: CreationCardBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 })
  }

  const { data: card, error } = await supabase
    .from("creation_cards")
    .insert({
      user_id: user.id,
      source_card_a_id: body.cardAId ?? null,
      source_card_b_id: body.cardBId ?? null,
      hooking_point: body.hookingPoint ?? null,
      content_structure: body.contentStructure ?? null,
      differentiation: body.differentiation ?? null,
      keywords: body.keywords ?? [],
      ai_insights: body.aiInsights ?? null,
      draft: body.draft ?? null,
    })
    .select()
    .single()

  if (error || !card) {
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 })
  }

  return NextResponse.json({ card }, { status: 201 })
}
