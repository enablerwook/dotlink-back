import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// 로그인 없이 접근 불가한 경로
const PROTECTED_PATHS = ["/analysis", "/library", "/synapse", "/feature-request"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── CSRF 방어: 신뢰할 수 없는 출처의 API 요청 차단 ─────────────────────────
  // 브라우저는 cross-origin 요청에만 Origin 헤더를 포함합니다.
  // Origin이 있으면서 현재 호스트와 다르면 → 외부 사이트에서의 요청으로 간주합니다.
  // SameSite=Lax 쿠키와 이중 방어 레이어를 구성합니다.
  if (pathname.startsWith("/api/")) {
    const origin = request.headers.get("origin")
    if (origin) {
      const host = request.headers.get("host") ?? ""
      const isAllowed =
        origin.includes(host) ||                                     // 같은 호스트 (프로덕션)
        /^https?:\/\/localhost(:\d+)?$/.test(origin) ||              // localhost (개발)
        /^https?:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)             // 127.0.0.1 (개발)

      if (!isAllowed) {
        return new NextResponse(
          JSON.stringify({ error: "허용되지 않은 출처입니다." }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        )
      }
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // 세션 갱신 — getUser()는 반드시 호출해야 쿠키 토큰이 자동 갱신됨
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p))

  // 미인증 사용자 → 보호 경로 접근 시 /login으로 리다이렉트
  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 인증된 사용자 → /login 접근 시 /analysis로 리다이렉트
  if (user && pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = "/analysis"
    return NextResponse.redirect(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // 정적 파일 및 Next.js 내부 경로 제외
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
