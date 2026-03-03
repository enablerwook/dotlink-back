import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"

// PATCH /api/library/[id] — 메모, 즐겨찾기, 분석 내용 수정
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  let body: { note?: string; isFavorite?: boolean; analysis?: Record<string, unknown> }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.note !== undefined) updates.note = body.note
  if (body.isFavorite !== undefined) updates.is_favorite = body.isFavorite
  if (body.analysis !== undefined) updates.analysis = body.analysis

  const { error } = await supabase
    .from("library_cards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/library/[id] — 카드 삭제
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { error } = await supabase
    .from("library_cards")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
