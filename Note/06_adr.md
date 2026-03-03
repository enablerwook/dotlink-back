# 06. Architecture Decision Records (ADR)

> Last Updated: 2026-02-25
> Source: 코드 자동 분석 + `.context/decisions.md` 참조

---

## 목차

- [ADR-001: Next.js 16 App Router 채택](#adr-001-nextjs-16-app-router-채택)
- [ADR-002: middleware.ts → proxy.ts 전환](#adr-002-middlewarets--proxysts-전환)
- [ADR-003: Supabase Auth 채택 (자체 인증 대신)](#adr-003-supabase-auth-채택-자체-인증-대신)
- [ADR-004: Domain-Driven Design(DDD) 폴더 구조 적용](#adr-004-domain-driven-designddd-폴더-구조-적용)
- [ADR-005: Google Gemini API 채택 (OpenAI 대신)](#adr-005-google-gemini-api-채택-openai-대신)
- [ADR-006: Apify 크롤러 채택 (직접 크롤링 대신)](#adr-006-apify-크롤러-채택-직접-크롤링-대신)
- [ADR-007: Tailwind CSS v4 채택](#adr-007-tailwind-css-v4-채택)
- [ADR-008: shadcn/ui 컴포넌트 라이브러리 채택](#adr-008-shadcnui-컴포넌트-라이브러리-채택)
- [ADR-009: React Context API로 전역 상태 관리](#adr-009-react-context-api로-전역-상태-관리)
- [ADR-010: 분석 결과를 library_cards에 복사하여 저장](#adr-010-분석-결과를-library_cards에-복사하여-저장)
- [ADR-011: 사용량 추적에 UPSERT 방식 채택](#adr-011-사용량-추적에-upsert-방식-채택)
- [ADR-012: 결제 게이트웨이 미결정 (Stripe 미채택)](#adr-012-결제-게이트웨이-미결정-stripe-미채택)
- [ADR-013: 멀티 에이전트 AI 시스템 구축](#adr-013-멀티-에이전트-ai-시스템-구축)

---

## ADR-001: Next.js 16 App Router 채택

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

풀스택 SaaS를 구축하기 위해 프레임워크를 선택해야 했다. React 19의 새 기능(Server Components, Suspense, Actions)을 활용하고 싶었다.

### 결정

Next.js 16 App Router를 채택한다.

### 이유

- React 19와의 완벽한 호환성 (Server Components, use() 훅)
- API Route Handlers로 풀스택 개발 가능 (별도 백엔드 서버 불필요)
- Vercel 배포와의 최적 통합
- `(dashboard)` 라우트 그룹으로 인증 레이아웃 분리 가능

### 결과

- `app/(dashboard)/` 라우트 그룹으로 인증 필요 페이지 묶음
- `app/api/` 하위에 모든 API 엔드포인트 배치
- 서버 컴포넌트와 클라이언트 컴포넌트의 명확한 분리 필요

---

## ADR-002: middleware.ts → proxy.ts 전환

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

Next.js 16에서 기존의 `middleware.ts` 파일명과 `export default function middleware()` 패턴이 `proxy.ts` / `export async function proxy()`로 변경되었다.

### 결정

Next.js 16 규격에 따라 `proxy.ts`를 프로젝트 루트에 위치시키고 `proxy` 함수를 export한다.

### 이유

- Next.js 16 표준 규격 준수
- 두 파일이 동시 존재하면 빌드 에러 발생

### 결과

- `proxy.ts`는 프로젝트 루트에 위치 (이동 금지)
- 함수명 `proxy`로 export (기존 `middleware` 아님)
- 인증 세션 확인 후 `/login` 또는 `/analysis`로 리다이렉트

---

## ADR-003: Supabase Auth 채택 (자체 인증 대신)

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

사용자 인증 시스템이 필요하다. 자체 인증 서버를 구축하거나 서드파티 서비스를 채택해야 했다.

### 결정

Supabase Auth를 채택한다 (Email/Password + Google OAuth).

### 이유

- PostgreSQL DB(Supabase)와의 통합이 자연스러움
- RLS(Row Level Security)와 인증 자동 연동
- Google OAuth가 기본 지원됨
- `@supabase/ssr` 패키지로 Next.js SSR 환경 지원
- JWT 세션 관리를 Supabase가 처리

### 결과

- `auth.users` → `public.users` 트리거로 자동 프로필 생성
- 서버/클라이언트 각각 별도 Supabase 클라이언트 분리 필수
  - `infrastructure/supabase/client.ts` (브라우저용)
  - `infrastructure/supabase/server.ts` (서버용)

---

## ADR-004: Domain-Driven Design(DDD) 폴더 구조 적용

**상태**: ✅ 결정 완료 (Phase 2에서 마이그레이션 완료)

### 컨텍스트

프로젝트 초기에는 `lib/` 하위에 모든 로직이 혼재되어 있었다. 기능이 추가될수록 코드 위치가 불명확해지고 의존성이 복잡해졌다.

### 결정

`domains/`, `infrastructure/`, `components/` 3계층 구조로 코드를 분리한다.

```
domains/         → 비즈니스 로직, 타입, 훅
infrastructure/  → 외부 서비스 추상화 (DB, AI, 크롤러)
components/      → UI 컴포넌트 (공유, 도메인별)
```

### 이유

- 도메인별 독립적인 개발 가능 (Auth, Analysis, Library, Synapse, Billing)
- 외부 서비스 변경 시 `infrastructure/` 만 수정
- 에이전트별 담당 영역 명확화 (`.agents/` 파일과 연동)

### 결과

- `lib/auth-context.tsx` → `domains/auth/auth-context.tsx`
- `lib/supabase/` → `infrastructure/supabase/`
- 각 도메인에 전담 에이전트 지시서 생성 (`.agents/`)

---

## ADR-005: Google Gemini API 채택 (OpenAI 대신)

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

콘텐츠를 9차원으로 분석하는 AI 모델이 필요하다. OpenAI GPT 계열과 Google Gemini 계열 중 선택해야 했다.

### 결정

Google Gemini API를 채택한다.
- 9차원 분석: `gemini-2.5-flash`
- 두 카드 비교 분석: `gemini-2.0-flash`

### 이유

- `gemini-2.5-flash`의 긴 컨텍스트 윈도우로 복잡한 분석 프롬프트 처리 가능
- 한국어 텍스트 처리 품질 양호
- 비용 대비 성능 (flash 모델 = 빠르고 저렴)
- 향후 YouTube Data API, Google Cloud와의 통합 용이성

### 결과

- `GOOGLE_GEMINI_API_KEY` 환경 변수 필수
- JSON 파싱 실패 대비 5회 재시도 로직 (`generateWithRetry`)
- OpenAI API는 Whisper STT 목적으로만 향후 선택적 사용 예정

---

## ADR-006: Apify 크롤러 채택 (직접 크롤링 대신)

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

Instagram, TikTok, YouTube 콘텐츠의 메타데이터(제목, 캡션, 조회수, 자막 등)를 추출해야 한다.

### 결정

Apify 서비스의 `apify~instagram-reel-scraper` Actor를 사용한다.

### 이유

- Instagram은 공식 API 접근이 제한적 → 직접 크롤링 시 차단 위험
- Apify가 안티봇 우회, 프록시 관리를 처리
- Actor 기반으로 플랫폼별 전환 용이
- 자막(transcript) 자동 추출 지원

### 결과

- Actor ID: `apify~instagram-reel-scraper` (`~` 구분자 필수, `/` 사용 시 404)
- API 토큰 없으면 URL 기반 최소 분석만 수행 (정확도 저하)
- TikTok/YouTube는 미구현 (UI에서 disabled)
- 타임아웃: 120초

---

## ADR-007: Tailwind CSS v4 채택

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

UI 스타일링 방법을 선택해야 했다.

### 결정

Tailwind CSS v4 + `@tailwindcss/postcss`를 사용한다.

### 이유

- v4는 CSS 변수 기반으로 shadcn/ui와의 통합이 자연스러움
- 다크/라이트 테마 전환이 CSS 변수로 쉽게 구현
- `@apply` 불필요, 유틸리티 클래스만으로 구현

### 결과

- `globals.css`에서 CSS 변수로 색상 체계 정의
- `tailwind-merge` + `clsx`로 조건부 클래스 처리 (`cn()` 유틸)

---

## ADR-008: shadcn/ui 컴포넌트 라이브러리 채택

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

UI 컴포넌트 라이브러리가 필요하다. 설치형 패키지(Material UI, Ant Design) vs. 소스 복사형 라이브러리 중 선택해야 했다.

### 결정

shadcn/ui를 채택한다 (`components/ui/` 하위에 소스 코드 복사).

### 이유

- Radix UI 기반으로 접근성(a11y) 보장
- 소스 코드를 직접 소유 → 커스터마이징 자유도 높음
- Tailwind CSS v4와 완벽 호환

### 결과

- `components/ui/` 파일은 직접 수정 금지 (업그레이드 대비)
- 커스터마이징은 래퍼 컴포넌트를 만들어서 처리

---

## ADR-009: React Context API로 전역 상태 관리

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

전역 상태 관리가 필요하다. Redux, Zustand, Jotai 등 별도 라이브러리와 React 내장 Context API 중 선택해야 했다.

### 결정

Redux/Zustand 없이 React Context API만 사용한다.

### 이유

- 전역 공유 상태가 적음 (user, selectedCardA만 해당)
- 외부 의존성 최소화
- Next.js App Router의 서버/클라이언트 컴포넌트 경계에서 Context 사용이 자연스러움
- 서버 데이터는 API 훅(`useLibraryCards`)으로 로컬 관리

### 결과

- `AuthContext`: 인증 상태 전역 공유
- `AppContext`: 시냅스 페이지의 `selectedCardA` 공유
- 대부분의 서버 데이터는 `useLibraryCards()` 같은 로컬 훅으로 관리

---

## ADR-010: 분석 결과를 library_cards에 복사하여 저장

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

라이브러리 카드가 분석 결과를 어떻게 참조할지 결정해야 했다. `analyses.id`만 FK로 저장하거나, 핵심 데이터를 복사하여 저장하거나.

### 결정

`library_cards`에 `analyses`의 핵심 정보(title, platform, url, scores 등)를 복사하여 저장한다. `analysis_id` FK는 원본 참조용으로만 유지.

### 이유

- `analyses` 레코드 삭제 시에도 `library_cards`는 독립적으로 유지
- 카드 목록 조회 시 JOIN 없이 단일 테이블 SELECT 가능 → 성능 유리
- `analysis_id`는 `ON DELETE SET NULL`로 설정

### 결과

- `library_cards.scores`는 `analyses.scores`의 복사본
- `analysis_id`가 NULL이어도 카드 정상 동작
- 데이터 중복이지만 독립성과 성능을 우선

---

## ADR-011: 사용량 추적에 UPSERT 방식 채택

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

월별 API 사용량을 원자적으로 증가시켜야 한다. Race condition 없이 안전하게 카운터를 증가시킬 방법이 필요했다.

### 결정

PostgreSQL의 `INSERT ... ON CONFLICT DO UPDATE` (UPSERT)를 활용한 RPC 함수 `increment_analysis_count()`를 사용한다.

### 이유

- `SELECT → UPDATE` 2단계 방식은 동시 요청 시 Race condition 발생 가능
- UPSERT는 단일 SQL로 원자적(atomic) 증가 보장
- `(user_id, year_month)` UNIQUE 제약이 자동으로 인덱스 역할

### 결과

- `public.usage_records` 테이블의 `(user_id, year_month)` 복합 UNIQUE 제약
- 월 최초 분석 시 INSERT, 이후 UPDATE로 처리
- Supabase RPC로 클라이언트에서 직접 호출 가능

---

## ADR-012: 결제 게이트웨이 미결정 (Stripe 미채택)

**상태**: 🔲 미결정

### 컨텍스트

구독형 SaaS이므로 결제 게이트웨이가 필요하다. Stripe가 일반적이지만, 한국 결제 환경(신용카드, 간편결제)을 고려해야 한다.

### 결정

결제 게이트웨이는 아직 미결정. `public.subscriptions` 테이블만 준비된 상태.

### 이유

- Stripe는 한국 원화(KRW) 지원하지만 간편결제(카카오페이, 토스페이) 미지원
- 토스페이먼츠, 아임포트 등 국내 PG 검토 중
- 비즈니스 요구사항(카드사, PG사 계약) 미확정

### 결과

- `public.subscriptions.payment_customer_id`, `payment_sub_id` 컬럼은 예약 필드
- 코드에서 "결제" 용어만 사용, 특정 게이트웨이 이름 노출 금지
- Phase 7에서 결정 예정

---

## ADR-013: 멀티 에이전트 AI 시스템 구축

**상태**: ✅ 결정 완료 (구현됨)

### 컨텍스트

DotLink는 Claude AI와 함께 개발된다. 프로젝트가 복잡해짐에 따라 AI 에이전트가 일관성 있게 코드를 생성하도록 가이드가 필요했다.

### 결정

`.agents/` 폴더에 도메인별 에이전트 지시서를 작성하고, `CLAUDE.md`를 오케스트레이터로 활용한다.

### 이유

- 도메인 전문 에이전트가 해당 영역에 집중하여 일관성 향상
- `CLAUDE.md`의 금지사항으로 코드 품질 가이드라인 강제
- `.context/` 폴더로 현재 진행 상황 공유

### 결과

- `CLAUDE.md`: 전체 오케스트레이터 (절대 금지사항, 컨벤션 포함)
- `.agents/auth-agent.md`, `analysis-agent.md`, ... (도메인별 지시서)
- `.context/current-sprint.md`, `checklist.md` (진행 상황 추적)

> **참고 문서**: [05_architecture.md](./05_architecture.md) | [00_project_overview.md](./00_project_overview.md)
