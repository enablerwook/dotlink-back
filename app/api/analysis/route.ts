import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"
import {
  detectPlatform,
  getMonthlyUsage,
  runAnalysis,
} from "@/domains/analysis/analysis-service"
import { PLAN_LIMITS } from "@/domains/billing/plan-limits"
import { enforceRateLimit } from "@/domains/billing/rate-limit-service"
import { RateLimitExceededError, UsageLimitExceededError } from "@/domains/billing/errors"
import { InvalidPlatformUrlError, UnsupportedPlatformError } from "@/domains/analysis/errors"
import type { Plan } from "@/domains/billing/types"

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 1. 인증 확인 (Fail Fast)
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

  // 3. 플랫폼 감지 및 URL 경로 검증
  //    ※ Rate Limit 체크보다 먼저 수행합니다.
  //      잘못된 입력에 Rate Limit 카운터를 소모하지 않기 위함입니다.
  // ERROR 2 FIX: ReturnType<typeof detectPlatform> 대신 명시적 타입 선언
  // null 체크 이후 TypeScript가 Platform으로 정확히 좁힐 수 있도록 합니다.
  let platform: import("@/lib/types").Platform | null
  try {
    platform = detectPlatform(url.trim())
  } catch (err) {
    if (err instanceof UnsupportedPlatformError) {
      // 화이트리스트엔 있지만 아직 미구현 플랫폼 (틱톡, 유튜브)
      return NextResponse.json(
        { error: "해당 플랫폼은 현재 지원 준비 중입니다. 인스타그램 릴스 URL을 사용해주세요." },
        { status: 400 },
      )
    }
    if (err instanceof InvalidPlatformUrlError) {
      // 잘못된 URL 형식, HTTPS 아님, 또는 릴스가 아닌 인스타그램 URL
      return NextResponse.json(
        { error: "올바르지 않은 URL입니다. 인스타그램 릴스 주소(https://instagram.com/reel/...)를 입력해주세요." },
        { status: 400 },
      )
    }
    throw err
  }

  if (!platform) {
    return NextResponse.json(
      { error: "지원하지 않는 URL입니다. 인스타그램, 틱톡, 유튜브 링크를 입력해주세요." },
      { status: 400 },
    )
  }

  // 4. Rate Limit 체크 (입력 검증 통과 후에만 카운터 소모)
  try {
    await enforceRateLimit(user.id, "analysis")
  } catch (err) {
    if (err instanceof RateLimitExceededError) {
      return NextResponse.json(
        {
          error: err.message,
          code: "RATE_LIMIT_EXCEEDED",
          retryAfterSeconds: err.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(err.retryAfterSeconds) },
        },
      )
    }
    throw err
  }

  // 5. 월간 사용량 한도 체크
  const { data: userData } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single()

  const plan = (userData?.plan ?? "starter") as Plan
  const limit = PLAN_LIMITS[plan].monthlyAnalysis
  const currentUsage = await getMonthlyUsage(user.id)

  if (limit !== Infinity && currentUsage >= limit) {
    const err = new UsageLimitExceededError(currentUsage, limit)
    return NextResponse.json(
      {
        error: err.message,
        code: "USAGE_LIMIT_EXCEEDED",
        currentUsage: err.currentUsage,
        limit: err.limit,
      },
      { status: 403 },
    )
  }

  // 6. 분석 실행
  try {
    const result = await runAnalysis(user.id, url.trim(), platform)
    return NextResponse.json(result)
  } catch (err) {
    // 내부 구현 상세는 서버 로그에만, 클라이언트에는 일반 메시지만 반환
    console.error("[Analysis API] 분석 실패:", err)
    return NextResponse.json({ error: "분석 중 오류가 발생했습니다." }, { status: 500 })
  }
}
