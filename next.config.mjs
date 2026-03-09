// ============================================================
// HTTP 보안 헤더
// 모든 라우트(페이지 + API)에 일괄 적용
// ============================================================
const securityHeaders = [
  // HTTPS만 허용 (2년, 서브도메인 포함)
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // 클릭재킹 차단 — iframe 삽입 전면 금지
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // MIME 타입 스니핑 차단 — Content-Type 헤더를 신뢰
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // 리퍼러 정보: 같은 출처는 전체, 외부로는 도메인만 전송
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // 불필요한 브라우저 기능 비활성화
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  // CSP: 허용된 리소스 출처만 로드
  // · script/style 'unsafe-inline': Next.js App Router 인라인 스크립트 필수
  // · connect-src: Supabase REST + Realtime(wss) 허용
  // · img-src https:: Apify/Instagram CDN 이미지 허용
  // · frame-ancestors 'none': CSP 레벨에서 iframe 삽입 이중 차단
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Node.js 네이티브 모듈 번들링 제외
  serverExternalPackages: ["fluent-ffmpeg", "ffmpeg-static", "openai"],

  // 모든 라우트에 보안 헤더 적용
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
