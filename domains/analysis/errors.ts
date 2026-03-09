// domains/analysis/errors.ts
// Analysis 도메인 Named Error 클래스들
// 절대 일반 Error("메시지")를 사용하지 말고, 이 클래스들을 사용하세요.

export class InvalidPlatformUrlError extends Error {
  readonly url: string

  constructor(url: string) {
    super("올바르지 않은 URL 형식이거나 HTTPS가 아닙니다.")
    this.name = "InvalidPlatformUrlError"
    this.url = url
    Object.setPrototypeOf(this, InvalidPlatformUrlError.prototype)
  }
}

export class UnsupportedPlatformError extends Error {
  readonly url: string

  constructor(url: string) {
    // WARNING 4 FIX: 메시지를 "준비 중"으로 변경 — 틱톡/유튜브 링크를 넣었을 때 throw되므로
    // "입력해주세요"는 모순적 메시지임
    super("해당 플랫폼은 현재 지원 준비 중입니다. 인스타그램 릴스 URL을 사용해주세요.")
    this.name = "UnsupportedPlatformError"
    this.url = url
    Object.setPrototypeOf(this, UnsupportedPlatformError.prototype)
  }
}
