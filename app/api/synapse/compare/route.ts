import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"
import { compareWithGemini } from "@/infrastructure/ai/gemini-compare"
import type { ContentCard } from "@/lib/types"
import type { AnalysisResult } from "@/domains/analysis/types"

function dbRowToContentCard(row: Record<string, unknown>): ContentCard {
  const scores = (row.scores ?? {}) as AnalysisResult
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    platform: row.platform as ContentCard["platform"],
    url: String(row.url ?? ""),
    thumbnailGradient: "",
    dateAnalyzed: "",
    frames: [],
    analysis: scores,
    tags: [],
  }
}

// POST /api/synapse/compare — 두 카드 AI 비교 분석
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  let body: { cardAId?: string; cardBId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 })
  }

  if (!body.cardAId || !body.cardBId) {
    return NextResponse.json(
      { error: "cardAId와 cardBId가 모두 필요합니다." },
      { status: 400 },
    )
  }

  if (body.cardAId === body.cardBId) {
    return NextResponse.json(
      { error: "서로 다른 카드를 선택해주세요." },
      { status: 400 },
    )
  }

  // 두 카드 조회 (본인 카드만)
  const { data: rows, error } = await supabase
    .from("library_cards")
    .select("id, title, platform, url, scores")
    .eq("user_id", user.id)
    .in("id", [body.cardAId, body.cardBId])

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!rows || rows.length < 2) {
    return NextResponse.json(
      { error: "카드를 찾을 수 없습니다." },
      { status: 404 },
    )
  }

  const rowMap = new Map(rows.map((r) => [r.id, r]))
  const rowA = rowMap.get(body.cardAId)
  const rowB = rowMap.get(body.cardBId)

  if (!rowA || !rowB) {
    return NextResponse.json(
      { error: "카드를 찾을 수 없습니다." },
      { status: 404 },
    )
  }

  const cardA = dbRowToContentCard(rowA as Record<string, unknown>)
  const cardB = dbRowToContentCard(rowB as Record<string, unknown>)

  try {
    const result = await compareWithGemini(cardA, cardB)
    return NextResponse.json({ result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "AI 분석에 실패했습니다."
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
