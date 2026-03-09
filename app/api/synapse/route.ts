import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"
import type { CreationSteps } from "@/domains/synapse/types"

interface SaveCreationCardBody {
  title?:          string
  sourceCardAId?:  string
  sourceCardBId?:  string
  steps:           Partial<CreationSteps>
  droppedFrames?:  Record<string, unknown>
}

function mapRow(row: Record<string, unknown>) {
  return {
    id:            row.id,
    userId:        row.user_id,
    sourceCardAId: row.source_card_a_id ?? null,
    sourceCardBId: row.source_card_b_id ?? null,
    title:         row.title ?? null,
    steps:         row.steps ?? {},
    droppedFrames: row.dropped_frames ?? {},
    createdAt:     row.created_at,
    updatedAt:     row.updated_at,
  }
}

// GET /api/synapse — 내 Creation Card 목록 조회
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("creation_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[GET /api/synapse]", error.message)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }

  return NextResponse.json({ cards: (data ?? []).map(mapRow) })
}

// POST /api/synapse — Creation Card 저장
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  let body: SaveCreationCardBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 })
  }

  if (!body.steps || typeof body.steps !== "object") {
    return NextResponse.json({ error: "steps 필드가 필요합니다." }, { status: 400 })
  }

  const { data: card, error } = await supabase
    .from("creation_cards")
    .insert({
      user_id:          user.id,
      title:            body.title ?? null,
      source_card_a_id: body.sourceCardAId ?? null,
      source_card_b_id: body.sourceCardBId ?? null,
      steps:            body.steps,
      dropped_frames:   body.droppedFrames ?? {},
    })
    .select()
    .single()

  if (error || !card) {
    console.error("[POST /api/synapse]", error?.message)
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 })
  }

  return NextResponse.json({ card: mapRow(card) }, { status: 201 })
}
