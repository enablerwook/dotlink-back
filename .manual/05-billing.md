# 05. 결제(Billing) 도메인 매뉴얼

## 개요

구독 플랜 관리, 사용량 추적, 결제 게이트웨이 연동을 담당하는 도메인입니다.

---

## 요금제 구조

| 플랜 | 가격 | 월 분석 횟수 | 라이브러리 | 팀 |
|---|---|---|---|---|
| Starter | 무료 | 5회 | 최대 10개 | 1명 |
| Creator | ₩29,000/월 | 50회 | 무제한 | 1명 |
| Pro | ₩59,000/월 | 무제한 | 무제한 | 5명 |

---

## 파일 구조 (DDD 적용 후)

```
domains/billing/
├── types.ts                         # Plan, UsageRecord, Subscription 타입
├── billing-service.ts               # 사용량 체크/차감, 플랜 확인 로직
├── plan-limits.ts                   # 플랜별 한도 상수
└── hooks/
    └── use-billing.ts               # 사용량/플랜 상태 훅

infrastructure/supabase/
└── billing-repository.ts            # 사용량/구독 DB 연산

infrastructure/payment/
└── payment-client.ts                # 결제 게이트웨이 클라이언트 (미결정)

app/
├── (dashboard)/billing/page.tsx     # 결제 & 플랜 페이지 (향후)
└── api/billing/
    ├── usage/route.ts               # GET — 현재 사용량 조회
    ├── upgrade/route.ts             # POST — 플랜 업그레이드
    └── webhook/route.ts             # POST — 결제 웹훅 수신

components/billing/
├── plan-card.tsx                    # 플랜 카드 UI
├── usage-meter.tsx                  # 사용량 미터 표시
└── upgrade-modal.tsx                # 업그레이드 유도 모달
```

---

## 플랜 한도 상수

```typescript
// domains/billing/plan-limits.ts
export const PLAN_LIMITS = {
  starter: {
    monthlyAnalysis: 5,
    libraryCards: 10,
    teamMembers: 1,
  },
  creator: {
    monthlyAnalysis: 50,
    libraryCards: Infinity,
    teamMembers: 1,
  },
  pro: {
    monthlyAnalysis: Infinity,
    libraryCards: Infinity,
    teamMembers: 5,
  },
} as const
```

---

## DB 스키마

### usage_records (월별 사용량)
```sql
CREATE TABLE public.usage_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year_month   TEXT NOT NULL,        -- 'YYYY-MM' 형식
  analysis_count INT DEFAULT 0,
  UNIQUE(user_id, year_month)
);
```

### subscriptions (구독 정보)
```sql
CREATE TABLE public.subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                TEXT CHECK (plan IN ('starter', 'creator', 'pro')),
  status              TEXT CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end  TIMESTAMPTZ,
  payment_customer_id TEXT,          -- 결제 게이트웨이 고객 ID
  payment_sub_id      TEXT,          -- 결제 게이트웨이 구독 ID
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);
```

---

## 사용량 체크 흐름

```
API Route 호출 (분석 요청)
  → billing-service.checkUsageLimit(userId)
  → usage_records에서 이번 달 count 조회
  → PLAN_LIMITS[user.plan].monthlyAnalysis와 비교
  → 한도 초과 → 403 에러 + 업그레이드 안내
  → 한도 이내 → 분석 진행 → usage_records count +1
```

---

## 결제 게이트웨이 연동 (미결정)

결제 게이트웨이는 아직 확정되지 않았습니다. 연동 시 고려사항:

- 웹훅(`/api/billing/webhook`)으로 구독 상태 동기화
- `subscriptions.status` 업데이트
- `public.users.plan` 업데이트
- 결제 실패 시 `past_due` → 다운그레이드 처리

---

## 현재 상태

- 플랜 구조: ✅ 설계 완료
- 사용량 추적: 🔲 미구현
- 결제 게이트웨이: 🔲 미결정/미구현
- 결제 페이지 UI: 🔲 미구현
