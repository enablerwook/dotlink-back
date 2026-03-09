// domains/billing/rate-limit-service.ts
// 비즈니스 규칙: 어떤 엔드포인트에 어떤 제한을 적용할지 결정
// DB 접근 금지 — infrastructure/supabase/rate-limit-repository 를 통해서만

import {
  checkAndIncrementRateLimit,
  type RateLimitEndpoint,
} from "@/infrastructure/supabase/rate-limit-repository"
import { RateLimitExceededError } from "@/domains/billing/errors"

// ============================================================
// Rate Limit 정책 상수
// 변경 시 이 파일만 수정하면 됩니다.
// ============================================================
const RATE_LIMIT_POLICY: Record<
  RateLimitEndpoint,
  { maxRequests: number; windowSeconds: number }
> = {
  analysis: {
    maxRequests: 2,   // 60초 내 최대 2회 (Gemini 분석은 10~30초 소요)
    windowSeconds: 60,
  },
  library: {
    maxRequests: 20,  // 60초 내 최대 20회
    windowSeconds: 60,
  },
}

/**
 * 지정된 엔드포인트에 대한 rate limit를 확인합니다.
 * 초과 시 RateLimitExceededError를 throw합니다 (절대 조용히 실패하지 않음).
 */
export async function enforceRateLimit(
  userId: string,
  endpoint: RateLimitEndpoint,
): Promise<void> {
  const policy = RATE_LIMIT_POLICY[endpoint]
  const allowed = await checkAndIncrementRateLimit(
    userId,
    endpoint,
    policy.maxRequests,
    policy.windowSeconds,
  )

  if (!allowed) {
    throw new RateLimitExceededError(endpoint, policy.windowSeconds)
  }
}
