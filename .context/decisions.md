# 아키텍처 결정 기록 (ADR)

_Architecture Decision Records — 중요한 기술적 의사결정을 기록합니다._

---

## ADR-001: Supabase Auth 선택

**날짜**: 2026-02-24
**상태**: 결정됨

**배경**: 인증 시스템 구현 방법 선택 필요

**결정**: Supabase Auth (Email/Password + Google OAuth)
- `@supabase/ssr` 패키지로 SSR 호환 쿠키 기반 세션 관리
- `createBrowserClient` (클라이언트) / `createServerClient` (서버) 구분

**이유**:
- Supabase MCP로 DB와 통합 관리 가능
- 내장 OAuth, 이메일 인증, RLS 연동 지원
- Next.js App Router와 호환성 우수

---

## ADR-002: 결제 게이트웨이 미결정 (Stripe 미사용)

**날짜**: 2026-02-25
**상태**: 결정됨

**배경**: 결제 시스템 구현 필요

**결정**: Stripe 미사용. 결제 게이트웨이는 추후 결정.
- 코드 내 "결제" 관련 용어만 사용
- `infrastructure/payment/payment-client.ts` 추상화 레이어로 게이트웨이 교체 용이하게 설계

**이유**:
- 사용자 요청에 따라 Stripe 제외
- 추상화 레이어로 어떤 결제 게이트웨이도 연결 가능하게 준비

---

## ADR-003: DDD(Domain-Driven Design) 구조 적용

**날짜**: 2026-02-25
**상태**: 결정됨

**배경**: 현재 flat 구조로 도메인 간 의존성이 불명확

**결정**: 바운디드 컨텍스트 기반 DDD 폴더 구조 적용
```
domains/ (비즈니스 로직)
infrastructure/ (외부 서비스)
components/ (UI 레이어)
app/ (라우팅 레이어, 얇게 유지)
```

**이유**:
- 도메인 간 명확한 책임 분리
- 각 도메인에 전용 에이전트 지시서로 AI 협업 효율화
- 외부 서비스 교체 용이 (infrastructure 레이어 격리)

---

## ADR-004: AI 분석 파이프라인 순서

**날짜**: 2026-02-25
**상태**: 결정됨

**결정**: Apify → Whisper → Gemini 순서

**이유**:
- Apify: 플랫폼별 크롤링 전문 서비스 (직접 크롤링 대비 안정적)
- Whisper: 자막이 없는 영상의 음성 텍스트 변환
- Gemini: 멀티모달 이해력, 한국어 분석 품질 우수

---

## ADR-005: 멀티에이전트 시스템 채택

**날짜**: 2026-02-25
**상태**: 결정됨

**결정**: 도메인별 전용 에이전트 지시서 + 오케스트레이터(CLAUDE.md) 구조

**구조**:
- `CLAUDE.md` — 전체 오케스트레이터
- `.manual/` — 도메인별 기술 매뉴얼
- `.agents/` — 도메인별 에이전트 지시서
- `.context/` — 계획, 체크리스트, 스키마

**이유**: 복잡한 SaaS 프로젝트에서 AI 작업 범위와 규칙을 명확히 하여 일관성 확보

---

## ADR-006: engagement 필드 JSONB 중첩 구조

**날짜**: 2026-03-01
**상태**: 결정됨

**배경**: engagement는 Apify의 정량 지표(likes, views 등)와 Gemini의 정성 분석(텍스트)을 동시에 저장해야 한다.

**결정**: `engagement` 필드를 JSONB 중첩 구조로 설계

```json
{
  "engagement": {
    "metrics": {
      "likes": 12000,
      "views": 340000,
      "comments": 450,
      "shares": 0
    },
    "analysis": "높은 조회수 대비 댓글 비율 낮음..."
  }
}
```

**이유**:
- 정량(`metrics`)과 정성(`analysis`)을 하나의 필드에서 관리 → 조회 시 JOIN 불필요
- Gemini는 `metrics` 데이터를 프롬프트에 포함하여 `analysis` 생성 (의존 관계 명확)
- `shares`는 Instagram API 미제공 → 기본값 `0` 처리

**대안 거부**: 별도 컬럼 분리 → 스키마 변경 부담; flat 구조 → 정량/정성 혼재 혼란

---

## ADR-007: OpenAI Whisper STT 도입

**날짜**: 2026-03-01
**상태**: 결정됨

**배경**: 인스타그램 릴스의 음성 콘텐츠를 대본으로 변환하여 `full_script` 필드 채우기 필요

**결정**: OpenAI Whisper API (`whisper-1` 모델) 사용

**파이프라인**:
1. `videoUrl` 있으면 → ffmpeg로 오디오 추출 (`-vn -acodec mp3`)
2. 추출된 MP3를 Whisper API에 전송
3. 텍스트 반환 → `full_script` 저장
4. `videoUrl` 없거나 음성 없으면 → `full_script: ""`

**이유**:
- Apify 자막보다 더 정확한 음성 인식 (특히 한국어)
- OpenAI SDK가 이미 Gemini와 함께 AI 파이프라인에서 사용 가능
- `ffmpeg-static`이 이미 Phase 8에서 설치됨 → 오디오 추출 추가 비용 없음

**필요 환경변수**: `OPENAI_API_KEY`

---

## ADR-008: 분석 결과 필드명 영문 비즈니스 언어로 통일

**날짜**: 2026-03-01
**상태**: 결정됨

**배경**: 기존 `hooking_video`, `script_appeal`, `sales_points` 등의 필드명이 한국어 개념을 영문 번역한 임시 명칭으로, DDD 비즈니스 언어로 부적절

**결정**: 9개 필드명을 아래와 같이 확정

| 기존 (임시) | 확정 (Phase 9) |
|---|---|
| `hooking_video` | `hook_analysis` |
| `hooking_text` | `hook_text` |
| `script_appeal` | `full_script` |
| `caption` | `caption` (유지) |
| `visual_style` | `production_note` |
| `engagement` | `engagement` (구조 변경, ADR-006) |
| `content_type` | `content_type` (유지) |
| `sales_points` | `selling_point` |
| `difficulty` | `difficulty` (유지) |

**이유**:
- DB 컬럼명, TypeScript 타입, UI 레이블이 동일한 도메인 언어 사용
- 영문으로 통일 → 다국어 확장 시 혼란 방지
- `full_script`는 Whisper STT 데이터임을 명확히 표현
