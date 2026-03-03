# DDD 구조 변환 로드맵

_최종 업데이트: 2026-02-25_

---

## 목표

현재 flat 구조를 DDD 바운디드 컨텍스트 기반 구조로 변환합니다.
UI(app/) → 도메인(domains/) → 인프라(infrastructure/) 레이어로 명확히 분리합니다.

---

## 현재 구조 → 목표 구조

### 현재 구조

```
lib/
├── supabase/
│   ├── client.ts          ← Supabase 브라우저 클라이언트
│   └── server.ts          ← Supabase 서버 클라이언트
├── auth-context.tsx       ← 전역 Auth 상태
├── app-context.tsx        ← 전역 App 상태 (라이브러리 카드 선택)
├── mock-data.ts           ← Mock 데이터 (ContentCard[], FeatureRequest[])
├── types.ts               ← 공통 타입 (ContentCard, AnalysisResult 등)
└── utils.ts               ← cn() 유틸

components/
├── analysis/              ← 분석 UI 컴포넌트
├── library/               ← 라이브러리 UI 컴포넌트
├── synapse/               ← 시냅스 UI 컴포넌트
├── app-sidebar.tsx
├── theme-provider.tsx
└── ui/                    ← shadcn/ui (수정 금지)

hooks/
├── use-mobile.ts
└── use-toast.ts

app/(dashboard)/
├── analysis/page.tsx
├── library/page.tsx
├── synapse/page.tsx
├── feature-request/page.tsx
└── layout.tsx
```

### 목표 구조 (DDD)

```
domains/
├── auth/
│   ├── types.ts                    ← User, Session 타입
│   └── auth-context.tsx            ← 이전: lib/auth-context.tsx
├── analysis/
│   ├── types.ts                    ← AnalysisResult, DnaScore 타입 (lib/types.ts에서 분리)
│   └── hooks/
│       └── use-analysis.ts         ← 분석 상태 훅 (신규)
├── library/
│   ├── types.ts                    ← ContentCard, LibraryCard 타입
│   └── hooks/
│       └── use-library.ts          ← 라이브러리 상태 훅 (신규)
├── synapse/
│   ├── types.ts                    ← CreationCard 타입
│   └── app-context.tsx             ← 이전: lib/app-context.tsx (selectedCardA 관리)
└── billing/
    ├── types.ts                    ← Plan, UsageRecord 타입
    └── plan-limits.ts              ← PLAN_LIMITS 상수 (신규)

infrastructure/
├── supabase/
│   ├── client.ts                   ← 이전: lib/supabase/client.ts
│   └── server.ts                   ← 이전: lib/supabase/server.ts
├── ai/
│   ├── whisper-client.ts           ← 신규
│   └── gemini-client.ts            ← 신규
├── apify/
│   └── apify-client.ts             ← 신규
└── payment/
    └── payment-client.ts           ← 신규 (결제 게이트웨이 추상화)

lib/                                ← 공통 유틸만 남김
├── utils.ts                        ← 유지 (cn 등)
├── mock-data.ts                    ← 유지 (테스트/개발용)
└── types.ts                        ← 공통 타입만 남김 (Platform, FrameData)

components/                         ← 구조 유지, shared/ 추가
├── shared/
│   ├── app-sidebar.tsx             ← 이전: components/app-sidebar.tsx
│   └── theme-provider.tsx          ← 이전: components/theme-provider.tsx
├── analysis/                       ← 유지
├── library/                        ← 유지
├── synapse/                        ← 유지
└── ui/                             ← 유지 (수정 금지)

hooks/                              ← 공통 훅만 남김
├── use-mobile.ts                   ← 유지
└── use-toast.ts                    ← 유지

app/(dashboard)/
├── api/                            ← 신규 (API Routes)
│   ├── analysis/route.ts
│   ├── library/route.ts
│   ├── synapse/route.ts
│   └── billing/
│       ├── usage/route.ts
│       └── webhook/route.ts
├── analysis/page.tsx               ← 유지
├── library/page.tsx                ← 유지
├── synapse/page.tsx                ← 유지
├── feature-request/page.tsx        ← 유지
└── layout.tsx                      ← AuthProvider import 경로 업데이트

supabase/migrations/                ← 마이그레이션 파일 추가
├── 20260224000000_init_users.sql   ← 완료
├── 20260225000001_analyses.sql     ← 신규
├── 20260225000002_library_cards.sql← 신규
├── 20260225000003_creation_cards.sql← 신규
└── 20260225000004_billing.sql      ← 신규
```

---

## 변환 실행 계획 (Step 3)

### Phase A: 디렉토리 생성

```bash
mkdir -p domains/auth
mkdir -p domains/analysis/hooks
mkdir -p domains/library/hooks
mkdir -p domains/synapse
mkdir -p domains/billing
mkdir -p infrastructure/supabase
mkdir -p infrastructure/ai
mkdir -p infrastructure/apify
mkdir -p infrastructure/payment
mkdir -p components/shared
mkdir -p app/api/analysis
mkdir -p app/api/library
mkdir -p app/api/synapse
mkdir -p app/api/billing/usage
mkdir -p app/api/billing/webhook
```

### Phase B: 파일 이동 (Move)

| 현재 위치 | 이동 위치 | 비고 |
|---|---|---|
| `lib/supabase/client.ts` | `infrastructure/supabase/client.ts` | import 경로 업데이트 필요 |
| `lib/supabase/server.ts` | `infrastructure/supabase/server.ts` | import 경로 업데이트 필요 |
| `lib/auth-context.tsx` | `domains/auth/auth-context.tsx` | import 경로 업데이트 필요 |
| `lib/app-context.tsx` | `domains/synapse/app-context.tsx` | import 경로 업데이트 필요 |
| `components/app-sidebar.tsx` | `components/shared/app-sidebar.tsx` | import 경로 업데이트 필요 |
| `components/theme-provider.tsx` | `components/shared/theme-provider.tsx` | import 경로 업데이트 필요 |

### Phase C: 타입 분리 (Types Extraction)

`lib/types.ts`에서 도메인별 types.ts로 분리:

| 타입 | 이동 위치 |
|---|---|
| `Platform` | `lib/types.ts` (공통 유지) |
| `FrameData` | `lib/types.ts` (공통 유지) |
| `AnalysisResult` | `domains/analysis/types.ts` |
| `ContentCard` | `domains/library/types.ts` |
| `FeatureRequest` | `lib/types.ts` (또는 feature-request 도메인) |
| `DifficultyRating` | `domains/analysis/types.ts` |

### Phase D: import 경로 업데이트

모든 파일에서 아래 경로 변경:

| 이전 경로 | 새 경로 |
|---|---|
| `@/lib/supabase/client` | `@/infrastructure/supabase/client` |
| `@/lib/supabase/server` | `@/infrastructure/supabase/server` |
| `@/lib/auth-context` | `@/domains/auth/auth-context` |
| `@/lib/app-context` | `@/domains/synapse/app-context` |
| `@/lib/types` (분리된 타입) | `@/domains/[domain]/types` |

영향받는 파일:
- `app/(dashboard)/layout.tsx` — AuthProvider, AppProvider
- `components/app-sidebar.tsx` → `components/shared/app-sidebar.tsx`
- `middleware.ts` — Supabase 클라이언트 (직접 import 없음, 유지)
- `app/login/page.tsx` — `@/lib/supabase/client` 업데이트
- `app/auth/callback/route.ts` — `@/lib/supabase/server` 업데이트
- `components/analysis/*.tsx` — types import 업데이트
- `components/library/*.tsx` — types import 업데이트
- `components/synapse/*.tsx` — app-context, types import 업데이트

### Phase E: tsconfig.json path alias 추가 (선택)

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@domains/*": ["./domains/*"],
      "@infra/*": ["./infrastructure/*"]
    }
  }
}
```

---

## 변환 후 검증 체크리스트

- [ ] `npm run build` 에러 없음
- [ ] 로그인 페이지 정상 작동
- [ ] 구글 OAuth 정상 작동
- [ ] 라이브러리 페이지 로드 (Mock 데이터)
- [ ] 시냅스 페이지 로드 (Mock 데이터)
- [ ] 분석 페이지 로드 (Mock 데이터)
- [ ] middleware 라우트 보호 작동 (미로그인 → /login 리다이렉트)

---

## 주의사항

1. **`middleware.ts`** 는 프로젝트 루트에서 절대 이동 금지
2. **`components/ui/`** 내 파일 수정 금지 (shadcn 자동 생성)
3. 파일 이동 후 반드시 `npm run build`로 빌드 검증
4. 한 번에 모든 파일을 이동하지 말고 Phase 순서대로 진행

---

## Phase 9 로드맵: AI 분석 9차원 데이터 구조 재설계

_시작일: 2026-03-01_

### 목표

AI 분석 파이프라인의 9개 차원 결과를 영문 비즈니스 언어 필드명으로 재정의하고,
각 필드의 데이터 출처(Apify / Whisper STT / Gemini)를 명확히 분리한다.

### 데이터 흐름

```
[인스타그램 URL]
        │
        ▼
   Apify 크롤링
        │
        ├──► caption (description 직접 사용)
        ├──► engagement.metrics (likes/views/comments/saveCount)
        └──► videoUrl
                │
                ├──► ffmpeg 오디오 추출
                │          │
                │          ▼
                │     Whisper STT
                │          │
                │          └──► full_script (또는 "" if 음성 없음)
                │
                └──► ffmpeg 프레임 추출 (Phase 8 완료)
                           │
                           └──► frames[] (Supabase Storage)

[full_script + caption + frames]
        │
        ▼
   Gemini (병렬 실행)
        ├──► hook_analysis + hook_text
        ├──► production_note
        ├──► content_type
        ├──► selling_point
        └──► difficulty

   Gemini (순차 실행 — hook + production 결과 활용)
        └──► engagement.analysis
```

### 영향받는 파일 (수정 범위)

| 파일 | 변경 내용 |
|---|---|
| `lib/types.ts` | `AnalysisResult` 필드명 재정의, `EngagementMetrics` 추가 |
| `infrastructure/ai/prompts.ts` | **신규** — Gemini 프롬프트 상수 6개 |
| `infrastructure/ai/whisper-client.ts` | **신규** — Whisper STT 클라이언트 |
| `infrastructure/apify/apify-client.ts` | `commentCount`, `saveCount` 추가 |
| `infrastructure/ai/gemini-client.ts` | 6개 함수로 분리 리팩토링 |
| `domains/analysis/analysis-service.ts` | 파이프라인 재설계 (병렬 + 순차) |
| `app/api/library/route.ts` | scores 매핑 업데이트 |
| `components/analysis/analysis-results.tsx` | 새 필드명 렌더링 |

### 의존성 설치

```bash
npm install openai
```

### 환경변수 추가

```
OPENAI_API_KEY=sk-...   # Whisper STT용
```

### Gemini 병렬/순차 실행 전략

```typescript
// 1단계: 병렬 실행 (5개 — 서로 독립적)
const [hook, production, contentType, selling, diff] = await Promise.all([
  analyzeHook(script, frames),
  analyzeProduction(script, frames),
  analyzeContentType(script, caption),
  analyzeSellingPoint(script, caption),
  analyzeDifficulty(script, frames),
])

// 2단계: 순차 실행 (engagement — hook + production 결과 활용)
const engagementAnalysis = await analyzeEngagement(
  apifyMetrics,
  script,
  hook.hook_analysis,       // 1단계 결과 활용
  production,               // 1단계 결과 활용
)
```
