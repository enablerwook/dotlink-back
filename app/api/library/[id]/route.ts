import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"
import type { AnalysisResult } from "@/lib/types"

// PATCH /api/library/[id] — 분석 내용 수정
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

  let body: { analysis?: AnalysisResult }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 })
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.analysis !== undefined) {
    updates.content_type        = body.analysis.content_type
    updates.hooking             = body.analysis.hooking
    updates.script              = body.analysis.script
    updates.caption             = body.analysis.caption
    updates.production          = body.analysis.production
    updates.selling_point       = body.analysis.selling_point
    updates.difficulty          = body.analysis.difficulty
    updates.engagement_analysis = body.analysis.engagement.analysis
  }

  const { error } = await supabase
    .from("library_cards")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) {
    console.error("[Library PATCH] DB 오류:", error.message)
    return NextResponse.json({ error: "수정에 실패했습니다." }, { status: 500 })
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
    console.error("[Library DELETE] DB 오류:", error.message)
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
