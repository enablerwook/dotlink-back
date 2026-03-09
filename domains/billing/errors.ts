// domains/billing/errors.ts
// 빌링/사용량 도메인의 Named Error 클래스들
// 절대 일반 Error("메시지")를 사용하지 말고, 이 클래스들을 사용하세요.

export class RateLimitExceededError extends Error {
  readonly retryAfterSeconds: number

  constructor(endpoint: string, windowSeconds: number) {
    super(`요청이 너무 많습니다. ${windowSeconds}초 후 다시 시도해주세요.`)
    this.name = "RateLimitExceededError"
    this.retryAfterSeconds = windowSeconds
    Object.setPrototypeOf(this, RateLimitExceededError.prototype)
  }
}

export class UsageLimitExceededError extends Error {
  readonly currentUsage: number
  readonly limit: number

  constructor(currentUsage: number, limit: number) {
    super(`이번 달 분석 횟수(${limit}회)를 모두 사용했습니다. 플랜을 업그레이드하세요.`)
    this.name = "UsageLimitExceededError"
    this.currentUsage = currentUsage
    this.limit = limit
    Object.setPrototypeOf(this, UsageLimitExceededError.prototype)
  }
}
