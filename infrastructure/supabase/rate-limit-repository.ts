// infrastructure/supabase/rate-limit-repository.ts
// DB 접근 전용: rate_limits 테이블의 check_and_increment_rate_limit RPC 호출
// 비즈니스 로직 금지 — 오직 DB 쿼리와 결과 변환만

import { createClient } from "@/infrastructure/supabase/server"

export type RateLimitEndpoint = "analysis" | "library"

/**
 * 원자적으로 요청 카운트를 증가시키고 허용 여부를 반환합니다.
 * PostgreSQL INSERT ... ON CONFLICT DO UPDATE 로 TOCTOU 경쟁 조건이 없습니다.
 *
 * @returns true  — 요청 허용 (현재 카운트 <= maxRequests)
 * @returns false — 요청 차단 (현재 카운트 > maxRequests)
 */
export async function checkAndIncrementRateLimit(
  userId: string,
  endpoint: RateLimitEndpoint,
  maxRequests: number,
  windowSeconds: number,
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc("check_and_increment_rate_limit", {
    p_user_id: userId,
    p_endpoint: endpoint,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    // DB 오류는 상위로 전파 — 조용히 실패 금지
    throw new Error(`Rate limit DB 오류: ${error.message}`)
  }

  // ERROR 3 FIX: as boolean 단순 캐스팅 대신 실제 타입 검증
  // Supabase RPC가 null 또는 예상치 못한 값을 반환할 경우 명시적 에러 처리
  if (typeof data !== "boolean") {
    throw new Error(`Rate limit RPC가 예상치 않은 값을 반환했습니다: ${typeof data}`)
  }

  return data
}
