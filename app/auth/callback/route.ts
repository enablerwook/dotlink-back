import { NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"

/**
 * Google OAuth 콜백 핸들러
 * Google 인증 완료 후 Supabase가 이 경로로 code를 보냄
 * code를 세션으로 교환하고 대시보드로 리다이렉트
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/analysis"

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 코드 없거나 교환 실패 시 로그인으로 돌려보냄
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
