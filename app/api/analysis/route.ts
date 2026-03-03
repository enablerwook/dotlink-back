import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"
import {
  detectPlatform,
  getMonthlyUsage,
  runAnalysis,
} from "@/domains/analysis/analysis-service"
import { PLAN_LIMITS } from "@/domains/billing/plan-limits"
import type { Plan } from "@/domains/billing/types"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  // 2. 요청 파싱
  let body: { url?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식입니다." }, { status: 400 })
  }

  const { url } = body

  if (!url?.trim()) {
    return NextResponse.json({ error: "URL을 입력해주세요." }, { status: 400 })
  }

  // 3. 플랫폼 감지
  const platform = detectPlatform(url.trim())
  if (!platform) {
    return NextResponse.json(
      { error: "지원하지 않는 URL입니다. 인스타그램, 틱톡, 유튜브 링크를 입력해주세요." },
      { status: 400 },
    )
  }

  // 4. 사용량 한도 체크
  const { data: userData } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single()

  const plan = (userData?.plan ?? "starter") as Plan
  const limit = PLAN_LIMITS[plan].monthlyAnalysis
  const currentUsage = await getMonthlyUsage(user.id)

  if (limit !== Infinity && currentUsage >= limit) {
    return NextResponse.json(
      {
        error: `이번 달 분석 횟수(${limit}회)를 모두 사용했습니다. 플랜을 업그레이드하세요.`,
        code: "USAGE_LIMIT_EXCEEDED",
        currentUsage,
        limit,
      },
      { status: 403 },
    )
  }

  // 5. 분석 실행
  try {
    const result = await runAnalysis(user.id, url.trim(), platform)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "분석 중 오류가 발생했습니다."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
