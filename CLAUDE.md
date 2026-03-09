# DotLink — 오케스트레이터 (CLAUDE.md)

> **이 파일은 Claude가 이 프로젝트에서 작업할 때 가장 먼저 읽어야 하는 파일입니다.**
> 모든 작업은 이 파일의 규칙을 따릅니다.

---

## 1. 서비스 개요

**DotLink**는 숏폼 크리에이터를 위한 AI 콘텐츠 DNA 분석 & 대본 생성 SaaS입니다.

- 인스타그램 릴스 / 틱톡 / 유튜브 쇼츠 URL을 입력하면 AI가 9가지 차원으로 분석
- 분석된 콘텐츠를 라이브러리에 저장하고 두 콘텐츠를 조합해 새 대본 설계
- 구독형 SaaS (Starter 무료 / Creator ₩29,000 / Pro ₩59,000)

---

## 2. 기술 스택 핵심 정보

| 항목 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router), React 19, TypeScript 5.7 |
| 인증 | Supabase Auth (Email + Google OAuth) |
| DB | Supabase PostgreSQL (RLS 활성화) |
| UI | shadcn/ui + Radix UI + Tailwind CSS v4 |
| AI | Apify (크롤링) → OpenAI Whisper (음성→텍스트) → Google Gemini (분석) |
| 결제 | 결제 게이트웨이 (미결정) |

---

## 3. 바운디드 컨텍스트 맵

```
┌─────────────┐   ┌──────────────┐   ┌─────────────┐
│    Auth     │   │   Analysis   │   │   Library   │
│  인증/세션   │──►│ AI 파이프라인 │──►│ 카드 저장/조회│
└─────────────┘   └──────────────┘   └──────┬──────┘
                                             │
┌─────────────┐   ┌──────────────┐          │
│   Billing   │   │   Synapse    │◄─────────┘
│ 구독/사용량  │──►│ 비교/대본생성  │
└─────────────┘   └──────────────┘
```

| 컨텍스트 | 위치 | 담당 에이전트 |
|---|---|---|
| Auth | `domains/auth/` | `.agents/auth-agent.md` |
| Analysis | `domains/analysis/` | `.agents/analysis-agent.md` |
| Library | `domains/library/` | `.agents/library-agent.md` |
| Synapse | `domains/synapse/` | `.agents/synapse-agent.md` |
| Billing | `domains/billing/` | `.agents/billing-agent.md` |

---

## 4. 프로젝트 폴더 구조 (DDD 적용 후)

```
/
├── app/                  # Next.js 라우팅 레이어 (얇게 유지)
│   ├── (dashboard)/      # 인증 필요 페이지
│   ├── api/              # API Route Handlers
│   ├── auth/callback/    # Google OAuth 콜백
│   └── login/
├── domains/              # 도메인 핵심 로직 ★
│   ├── auth/
│   ├── analysis/
│   ├── library/
│   ├── synapse/
│   └── billing/
├── infrastructure/       # 외부 서비스 연동 ★
│   ├── supabase/
│   ├── ai/
│   ├── apify/
│   └── payment/
├── components/           # UI 컴포넌트
│   ├── shared/
│   ├── analysis/
│   ├── library/
│   ├── synapse/
│   └── ui/
├── lib/                  # 공통 유틸 (utils.ts, 공통 types.ts)
├── hooks/
├── supabase/migrations/
├── proxy.ts              # Next.js 16 라우트 보호 (구 middleware.ts)
├── CLAUDE.md             # ← 지금 이 파일
├── .manual/              # 스킬 매뉴얼
├── .agents/              # 에이전트 지시서
└── .context/             # 계획서 & 체크리스트
```

---

## 5. 에이전트 호출 규칙

작업 전 반드시 해당 도메인의 에이전트 지시서를 확인하세요.

```
인증 관련 작업       → .agents/auth-agent.md 참조
AI 분석 파이프라인   → .agents/analysis-agent.md 참조
라이브러리 CRUD     → .agents/library-agent.md 참조
시냅스/대본 생성    → .agents/synapse-agent.md 참조
구독/결제/사용량     → .agents/billing-agent.md 참조
```

도메인 지식이 필요하면 `.manual/` 파일을 참조하세요.
현재 진행 상황은 `.context/current-sprint.md`를 확인하세요.

---

## 6. 절대 금지사항

- `proxy.ts`를 프로젝트 루트 외 다른 위치로 이동 금지 (Next.js 16 규격, 구 middleware.ts)
- `components/ui/` 내 shadcn 컴포넌트를 직접 수정 금지 (업그레이드 대비)
- `NEXT_PUBLIC_` 접두사로 서버 전용 시크릿 키 노출 금지
- mock-data를 실제 비즈니스 로직에 직접 사용 금지 (테스트 목적 한정)
- RLS 없이 Supabase 테이블 생성 금지
- 클라이언트 컴포넌트에서 서버 전용 Supabase 클라이언트(`server.ts`) 사용 금지

---

## 7. 코딩 컨벤션 요약

자세한 내용은 `.manual/07-conventions.md` 참조.

- 파일명: `kebab-case.ts`
- 컴포넌트: `PascalCase`
- 함수/변수: `camelCase`
- 상수: `UPPER_SNAKE_CASE`
- import 경로: `@/domains/`, `@/infrastructure/`, `@/components/` alias 사용

---

## 7-1. 핵심 엔지니어링 원칙 (모든 코드에 적용)

**이 원칙들은 모든 구현 작업에 반드시 적용됩니다.**

### SRP — 단일 책임 원칙
- 함수/파일 하나는 딱 하나의 책임만 가집니다
- 함수명에 `And`가 들어간다면 분리 신호입니다
- Route Handler는 인증·검증·서비스 호출만 담당합니다. 비즈니스 로직은 `domains/`로

### Explicit over Implicit — 명시 > 암묵
- 절대 조용히 실패하지 않습니다. `return {}` 대신 `throw new DomainError()`
- 빈 객체·빈 배열로 에러를 숨기는 fallback 금지
- 함수의 반환 타입을 항상 명시합니다

### Fail Fast — 빨리 실패하기
- 함수 초반 Guard Clause로 유효하지 않은 상태를 즉시 차단합니다
- 중첩 if 대신 early return을 사용합니다
```typescript
// ❌ 중첩
if (user) { if (plan) { ... } }

// ✅ Early Return
if (!user) throw new UnauthorizedError()
if (!plan) throw new PlanNotFoundError()
```

### Named Errors — 명명된 에러 클래스
- `Error("뭔가 잘못됨")` 대신 도메인 에러 클래스를 사용합니다
- 에러 클래스는 `domains/{context}/errors.ts`에 정의합니다
```typescript
// ✅ 에러 타입으로 의도를 드러냄
throw new UsageLimitExceededError(userId, currentUsage, limit)
throw new InvalidPlatformUrlError(url)
```

### Push Logic Down — 로직은 도메인으로
```
app/api/**/route.ts  →  인증 확인, 입력 파싱, 서비스 호출, 응답 변환만
domains/**/*-service.ts  →  비즈니스 로직 전체
infrastructure/**  →  외부 서비스 호출만
```

### Pure Functions — 순수 함수 우선
- 같은 입력 → 항상 같은 출력이 되도록 작성합니다
- DB 조회·외부 API 호출은 서비스 레이어에만 위치합니다
- 순수 변환 함수(mapping, parsing)는 사이드 이펙트 없이 작성합니다

### DDD Ubiquitous Language — 도메인 용어 일관성
- 비즈니스 용어를 코드에 그대로 사용합니다
- 도메인 용어 → 파일명/함수명/변수명 직결
```
"분석"       → analyzeContent()  (❌ processVideo, ❌ handleRequest)
"라이브러리 카드" → LibraryCard  (❌ Card, ❌ Item, ❌ Entry)
"시냅스"      → SynapseComparison (❌ Comparison, ❌ Result)
```

---

## 8. 현재 구현 상태

| 기능 | 상태 |
|---|---|
| 랜딩 페이지 | ✅ 완성 |
| 로그인/회원가입 (Email + Google OAuth) | ✅ 완성 |
| 인증 미들웨어 (라우트 보호) | ✅ 완성 |
| Supabase public.users + 트리거 | ✅ 완성 |
| DNA 분석 UI | ✅ 완성 (Mock 데이터) |
| 라이브러리 UI | ✅ 완성 (Mock 데이터) |
| 시냅스 UI | ✅ 완성 (Mock 데이터) |
| **AI 분석 파이프라인** | 🔲 미구현 |
| **분석 결과 DB 저장** | 🔲 미구현 |
| **사용량 제한 미들웨어** | 🔲 미구현 |
| **결제 연동** | 🔲 미구현 |
| **Creation Card DB 저장** | 🔲 미구현 |

---

_최종 업데이트: 2026-02-25_
