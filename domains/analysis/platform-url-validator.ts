// domains/analysis/platform-url-validator.ts
// 순수 함수: 플랫폼 URL 파싱 및 검증만 담당 (DB 조회·외부 호출 없음)
//
// 보안 설계 원칙:
//   - 화이트리스트 기반: 허용된 호스트명만 통과 (나머지 전체 차단)
//   - URL 객체 파싱: 단순 문자열 포함 검사 대신 URL 파서로 호스트명을 정확히 추출
//   - HTTPS 강제: http:// 또는 다른 프로토콜 차단
//
// 차단되는 우회 시도 예시:
//   https://instagram.com.attacker.com  → hostname = 'instagram.com.attacker.com' → 불일치
//   https://attacker.com@instagram.com  → hostname = 'instagram.com'              → 통과 (정상)
//   http://instagram.com/reel/...       → protocol = 'http:'                      → 차단
//   https://169.254.169.254/...         → hostname = '169.254.169.254'            → 불일치

import type { Platform } from "@/lib/types"
import { InvalidPlatformUrlError, UnsupportedPlatformError } from "@/domains/analysis/errors"

// ============================================================
// 허용된 호스트명 화이트리스트
// 이 목록에 없는 모든 호스트명은 차단됩니다.
// 새 플랫폼 추가 시 이 상수만 수정하세요.
// ============================================================
const ALLOWED_HOSTNAMES: Record<Platform, ReadonlySet<string>> = {
  instagram: new Set(["instagram.com", "www.instagram.com"]),
  tiktok:    new Set(["tiktok.com", "www.tiktok.com", "vm.tiktok.com"]),
  youtube:   new Set(["youtube.com", "www.youtube.com", "youtu.be", "m.youtube.com"]),
}

// ============================================================
// 현재 크롤러가 구현된 플랫폼 목록
// 화이트리스트에 있지만 아직 구현 안 된 플랫폼은 여기에 추가하지 않습니다.
// 틱톡/유튜브 크롤러 구현 완료 시 추가하세요.
// ============================================================
export const SUPPORTED_PLATFORMS: ReadonlySet<Platform> = new Set(["instagram"])

// ============================================================
// 플랫폼별 유효한 콘텐츠 경로 패턴
// 릴스가 아닌 프로필, 피드 게시물 등은 크롤링 불가 → 사전 차단
// ============================================================
const VALID_PATH_PATTERNS: Partial<Record<Platform, RegExp>> = {
  // /reel/shortcode 또는 /reels/shortcode 형식만 허용 (trailing slash 선택, 이후 경로 불허)
  // WARNING 1 FIX: $ 앵커 추가 — /reel/abc/extra/path 같은 변형 차단
  instagram: /^\/(reel|reels)\/[A-Za-z0-9_-]+(\/)?$/,
}

/**
 * URL을 파싱하고 지원하는 플랫폼을 반환합니다.
 *
 * @throws {InvalidPlatformUrlError}   URL 형식이 잘못됐거나 HTTPS가 아닌 경우
 * @throws {InvalidPlatformUrlError}   플랫폼은 맞지만 콘텐츠 경로가 유효하지 않은 경우
 *                                     (예: 릴스 아닌 인스타그램 프로필 URL)
 * @throws {UnsupportedPlatformError}  화이트리스트엔 있지만 아직 미구현 플랫폼
 * @returns Platform  — 지원하는 플랫폼 (현재: "instagram"만)
 * @returns null      — 유효한 URL이지만 알 수 없는 플랫폼
 */
export function detectPlatform(url: string): Platform | null {
  // 1. URL 파싱 — 형식이 잘못됐으면 즉시 throw (Fail Fast)
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new InvalidPlatformUrlError(url)
  }

  // 2. HTTPS 강제 — http:// 또는 커스텀 프로토콜 차단
  if (parsed.protocol !== "https:") {
    throw new InvalidPlatformUrlError(url)
  }

  // 3. 호스트명 화이트리스트 매칭 (대소문자 무시)
  const hostname = parsed.hostname.toLowerCase()

  let matchedPlatform: Platform | null = null
  for (const [platform, allowed] of Object.entries(ALLOWED_HOSTNAMES) as [
    Platform,
    ReadonlySet<string>,
  ][]) {
    if (allowed.has(hostname)) {
      matchedPlatform = platform
      break
    }
  }

  // 알 수 없는 플랫폼 → null 반환 (호출부에서 "지원하지 않는 URL" 처리)
  if (matchedPlatform === null) return null

  // 4. 현재 구현된 플랫폼인지 확인
  //    알려진 플랫폼이지만 아직 미구현 → UnsupportedPlatformError (Rate Limit 소모 전에 차단)
  if (!SUPPORTED_PLATFORMS.has(matchedPlatform)) {
    // ERROR 1 FIX: url(원본 입력값)을 전달 — matchedPlatform은 Platform 타입으로 의미가 다름
    throw new UnsupportedPlatformError(url)
  }

  // 5. 플랫폼별 콘텐츠 경로 검증
  //    예: 인스타그램 프로필 URL → /reel/ 경로 없음 → 크롤링 불가 → 사전 차단
  const pathPattern = VALID_PATH_PATTERNS[matchedPlatform]
  if (pathPattern && !pathPattern.test(parsed.pathname)) {
    throw new InvalidPlatformUrlError(url)
  }

  return matchedPlatform
}
