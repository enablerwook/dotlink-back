# 결제 + 레퍼럴 시스템 — 구현 체크리스트 & DB 스키마

_최종 업데이트: 2026-03-09_

---

## 미결정 사항 (작업 전 반드시 결정 필요)

| # | 항목 | 상태 | 비고 |
|---|---|---|---|
| 1 | 결제 게이트웨이 선택 | 🔲 미결정 | 토스페이먼츠 / 포트원 / KG이니시스 |
| 2 | 자동갱신 시 레퍼럴 리워드 반복 지급 여부 | 🔲 미결정 | 첫 결제만 vs 매월 지급 |
| 3 | 출금 처리 SLA | 🔲 미결정 | 신청 후 며칠 내 처리할지 |
| 4 | 출금 수수료 부담 주체 | 🔲 미결정 | 서비스 부담 vs 유저 부담 |
| 5 | 월 출금 횟수 제한 | 🔲 미결정 | 무제한 vs 월 1회 제한 |

**확정된 사항:**
- 환불 시 레퍼럴 리워드 회수 (`clawed_back`) ✅
- 리워드 만료 없음 (무기한 누적) ✅
- 최소 출금 금액: ₩10,000 ✅

---

## 구현 체크리스트

---

### Phase A: DB 마이그레이션 🔲

> **주의:** 마이그레이션 SQL은 별도 작업으로 진행. 이 체크리스트에서는 설계만 확정.

- [ ] `public.users` 컬럼 추가 (`referral_code`, `referred_by`, `pending_reward`, `total_paid_out`, `total_referrals`)
- [ ] `public.subscriptions` 컬럼 추가 (`cancel_at_period_end`, `next_plan`)
- [ ] `public.plans` 테이블 생성 + 초기 데이터 (starter / creator / pro)
- [ ] `public.payments` 테이블 생성
- [ ] `public.referral_tiers` 테이블 생성 + 초기 티어 데이터
- [ ] `public.referral_rewards` 테이블 생성
- [ ] `public.user_payout_accounts` 테이블 생성
- [ ] `public.payout_requests` 테이블 생성
- [ ] `public.global_settings` 테이블 생성 + 초기값 (`min_payout_amount_krw = 10000`)
- [ ] 마이그레이션 SQL 작성 (`supabase/migrations/`)
- [ ] Supabase에 마이그레이션 적용 및 RLS 검증

---

### Phase B: 레퍼럴 코드 & 회원가입 연동 🔲

- [ ] `public.users` 트리거 수정 — 회원가입 시 `referral_code` 자동 생성 (8자리 랜덤 영숫자)
- [ ] `GET /api/referral/validate?code=XXXX` — 추천인 코드 유효성 검증 API
- [ ] 회원가입 페이지에 추천인 코드 입력 필드 추가
- [ ] 가입 완료 시 `referred_by` 저장 (유효한 코드인 경우)
- [ ] 자기 코드 입력 차단 처리
- [ ] `referral_rewards` 레코드 생성 (`status = 'pending'`) — 아직 결제 전 상태

---

### Phase C: 결제 게이트웨이 연동 🔲

> **전제 조건:** 미결정 사항 #1 (PG 선택) 완료 후 진행

- [ ] PG SDK 설치 및 `infrastructure/payment/` 클라이언트 구현
- [ ] `POST /api/billing/checkout` — 결제 요청 Route Handler
  - 인증 확인 → 플랜 검증 → PG 결제창 연동
- [ ] `POST /api/billing/webhook` — PG Webhook 수신
  - 멱등성 처리 (`payment_key` UNIQUE 제약)
  - 결제 성공 → `payments` INSERT → `subscriptions` UPDATE → `users.plan` UPDATE
  - 결제 실패 → `payments.status = 'failed'` → 유저 이메일 알림
- [ ] 자동 갱신 실패 재시도 로직 (3일간 1일 1회)
- [ ] 재시도 3회 실패 → `subscriptions.status = 'past_due'` → `users.plan = 'starter'` 강등
- [ ] 업그레이드 차액 계산 로직 (Pro ↔ Creator 전환)
- [ ] `cancel_at_period_end` 플래그 처리 (기간 만료 시 자동 취소)

---

### Phase D: 레퍼럴 리워드 처리 🔲

- [ ] `domains/billing/rate-limit-service.ts` → `domains/billing/referral-service.ts` 분리
- [ ] 결제 성공 시 레퍼럴 리워드 계산 서비스
  - `referred_by` NULL 체크 → 추천인 조회
  - `referral_tiers`에서 현재 티어 조회 (`total_referrals` 기준)
  - `amount_krw = 결제금액 × reward_percent / 100`
  - `referral_rewards.status = 'earned'` 업데이트
  - `users.pending_reward += amount` 원자적 업데이트
- [ ] 환불 시 리워드 회수 처리
  - `referral_rewards.status = 'clawed_back'`
  - `users.pending_reward -= amount` (단, 0 미만 방지)
- [ ] 자동갱신 시 리워드 지급 여부 처리 — **미결정 #2 확정 후 구현**
- [ ] 어뷰징 탐지 플래그 (`same_ip_24h_count >= 3` → `status = 'flagged'`)

---

### Phase E: 출금 시스템 🔲

- [ ] `POST /api/billing/payout-account` — 계좌 등록/수정
- [ ] `GET /api/billing/payout-account` — 등록된 계좌 조회
- [ ] `POST /api/billing/payout` — 출금 신청
  - `pending_reward >= min_payout_amount` 검증 (`global_settings` 조회)
  - 계좌 등록 여부 확인
  - `payout_requests` INSERT
  - `users.pending_reward = 0` 잠금 처리
- [ ] 관리자 전용 API — 출금 목록 조회 / 처리 / 거절
  - `PATCH /api/admin/payout/[id]` — `status = 'paid' | 'rejected'`
  - 거절 시 `users.pending_reward` 복원 (롤백)
- [ ] 출금 완료/거절 이메일 알림

---

### Phase F: 구독 관리 UI 🔲

- [ ] `/settings/billing` 페이지
  - 현재 플랜 표시
  - 플랜 비교 카드 (Starter / Creator / Pro)
  - 업그레이드 / 다운그레이드 버튼
- [ ] 결제 내역 테이블 (`GET /api/billing/payments`)
- [ ] 구독 취소 확인 모달
- [ ] 레퍼럴 코드 공유 UI (내 코드 + 복사 버튼 + 링크 생성)
- [ ] 리워드 잔액 표시 + 출금 신청 UI
  - 잔액 < ₩10,000 → 출금 버튼 비활성화 + 부족분 안내
  - 계좌 미등록 → 계좌 등록 유도

---

### Phase G: 타입 검사 & 통합 테스트 🔲

- [ ] `npx tsc --noEmit` 0 errors
- [ ] S-01 ~ S-25 시나리오별 수동 검증
- [ ] 멱등성 테스트 — 동일 `payment_key` 중복 webhook 처리
- [ ] 어뷰징 시나리오 검증 (동일 IP 다중 계정)

---

## DB 스키마 설계

---

### 변경 테이블

#### public.users — 컬럼 추가 (ALTER TABLE)

| 컬럼명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `referral_code` | `TEXT UNIQUE NOT NULL` | 트리거 자동 생성 | 내 추천인 코드 (8자리) |
| `referred_by` | `UUID REFERENCES users(id)` | `NULL` | 나를 추천한 유저 ID |
| `total_referrals` | `INT` | `0` | 내가 추천한 누적 인원 수 |
| `pending_reward` | `INT` | `0` | 미지급 리워드 잔액 (원) |
| `total_paid_out` | `INT` | `0` | 누적 지급된 리워드 총액 (원) |

#### public.subscriptions — 컬럼 추가 (ALTER TABLE)

| 컬럼명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `cancel_at_period_end` | `BOOLEAN` | `false` | 기간 만료 시 취소 예약 여부 |
| `next_plan` | `TEXT` | `NULL` | 다음 갱신 시 적용할 플랜 (다운그레이드 예약) |

---

### 신규 테이블

#### 1. public.plans

| 컬럼명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `TEXT PK` | — | `'starter'`, `'creator'`, `'pro'` |
| `name` | `TEXT NOT NULL` | — | 표시 이름 (예: `'Creator'`) |
| `price_krw` | `INT NOT NULL` | `0` | 월 가격 (원), Starter=0 |
| `features` | `JSONB NOT NULL` | `'{}'` | 플랜별 제공 서비스 (확장 가능) |
| `is_active` | `BOOLEAN` | `true` | 비활성 플랜 숨김 처리용 |
| `display_order` | `INT` | `0` | UI 표시 순서 |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |

**features JSONB 예시:**
```json
{
  "analysis_limit": 5,
  "library_limit": 10,
  "synapse_enabled": true,
  "export_enabled": false,
  "priority_support": false
}
```

> RLS: 전체 공개 (SELECT only, 수정은 service role만)

---

#### 2. public.payments

| 컬럼명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` | — |
| `user_id` | `UUID FK → users` | — | 결제한 유저 |
| `subscription_id` | `UUID FK → subscriptions` | `NULL` | 연결된 구독 |
| `amount_krw` | `INT NOT NULL` | — | 결제 금액 (원) |
| `plan` | `TEXT NOT NULL` | — | 결제 시점 플랜명 |
| `status` | `TEXT NOT NULL` | `'pending'` | `pending` / `succeeded` / `failed` / `refunded` |
| `payment_key` | `TEXT UNIQUE` | `NULL` | PG사 고유 결제 키 (멱등성 보장) |
| `pg_provider` | `TEXT` | `NULL` | PG사 이름 (예: `'toss'`) |
| `pg_raw` | `JSONB` | `NULL` | PG 원본 응답 데이터 |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |

> RLS: `user_id = auth.uid()` SELECT만 허용 / INSERT·UPDATE는 service role만

---

#### 3. public.referral_tiers

| 컬럼명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` | — |
| `name` | `TEXT NOT NULL` | — | 티어명 (예: `'Bronze'`, `'Silver'`, `'Gold'`) |
| `min_referrals` | `INT NOT NULL` | — | 이 티어 진입에 필요한 최소 추천 인원 수 |
| `reward_percent` | `NUMERIC(5,2) NOT NULL` | — | 리워드 비율 (%) |
| `is_active` | `BOOLEAN` | `true` | 비활성 티어 숨김 처리용 |
| `display_order` | `INT` | `0` | UI 표시 순서 |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |

**초기 데이터 예시:**

| name | min_referrals | reward_percent |
|---|---|---|
| Bronze | 0 | 10.00 |
| Silver | 10 | 15.00 |
| Gold | 30 | 20.00 |

> RLS: 전체 공개 (SELECT only)

---

#### 4. public.referral_rewards

| 컬럼명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` | — |
| `referrer_id` | `UUID FK → users` | — | 리워드를 받는 추천인 |
| `referee_id` | `UUID FK → users` | — | 추천받아 가입/결제한 유저 |
| `payment_id` | `UUID FK → payments` | `NULL` | 연결된 결제 (결제 전이면 NULL) |
| `tier_id` | `UUID FK → referral_tiers` | `NULL` | 적용된 티어 |
| `amount_krw` | `INT NOT NULL` | — | 리워드 금액 (원) |
| `status` | `TEXT NOT NULL` | `'pending'` | `pending` / `earned` / `clawed_back` / `flagged` / `paid_out` |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | — |

**status 흐름:**
```
pending → earned (결제 성공 시)
earned  → clawed_back (환불 시)
earned  → paid_out (출금 완료 시)
earned  → flagged (어뷰징 탐지 시)
```

> RLS: `referrer_id = auth.uid()` SELECT만 허용 / 수정은 service role만

---

#### 5. public.user_payout_accounts

| 컬럼명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` | — |
| `user_id` | `UUID FK → users UNIQUE` | — | 유저당 계좌 1개 제한 |
| `bank_name` | `TEXT NOT NULL` | — | 은행명 (예: `'국민은행'`) |
| `account_number` | `TEXT NOT NULL` | — | 계좌번호 |
| `account_holder` | `TEXT NOT NULL` | — | 예금주 |
| `is_verified` | `BOOLEAN` | `false` | 계좌 검증 여부 (1원 인증 등) |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | — |

> RLS: `user_id = auth.uid()` SELECT / INSERT / UPDATE 허용

---

#### 6. public.payout_requests

| 컬럼명 | 타입 | 기본값 | 설명 |
|---|---|---|---|
| `id` | `UUID PK` | `gen_random_uuid()` | — |
| `user_id` | `UUID FK → users` | — | 출금 신청 유저 |
| `account_id` | `UUID FK → user_payout_accounts` | — | 출금 대상 계좌 |
| `amount_krw` | `INT NOT NULL` | — | 출금 신청 금액 (원) |
| `status` | `TEXT NOT NULL` | `'pending'` | `pending` / `paid` / `rejected` |
| `reject_reason` | `TEXT` | `NULL` | 거절 사유 |
| `paid_at` | `TIMESTAMPTZ` | `NULL` | 실제 이체 완료 시각 |
| `created_at` | `TIMESTAMPTZ` | `now()` | — |
| `updated_at` | `TIMESTAMPTZ` | `now()` | — |

> RLS: `user_id = auth.uid()` SELECT / INSERT 허용 / UPDATE는 service role만 (관리자)

---

#### 7. public.global_settings

| 컬럼명 | 타입 | 설명 |
|---|---|---|
| `key` | `TEXT PK` | 설정 키 |
| `value` | `TEXT NOT NULL` | 설정 값 |
| `description` | `TEXT` | 설명 |
| `updated_at` | `TIMESTAMPTZ` | — |

**초기 데이터:**

| key | value | description |
|---|---|---|
| `min_payout_amount_krw` | `10000` | 최소 출금 가능 금액 (원) |

> RLS: 전체 공개 (SELECT only) / 수정은 service role만

---

### ERD (전체)

```
auth.users (Supabase 관리)
    │
    ▼ 1:1 (트리거)
public.users ◄────────────────────────────────┐
    │  referred_by (self-ref)                  │
    │  1:N                                     │
    ├──► public.analyses                       │
    ├──► public.library_cards                  │
    ├──► public.creation_cards                 │
    ├──► public.usage_records                  │
    ├──► public.subscriptions                  │
    │       │ 1:N                              │
    │       └──► public.payments               │
    │                                          │
    ├──► public.referral_rewards (referrer_id)─┘
    │    public.referral_rewards (referee_id) ─┘
    │       │ N:1
    │       └──► public.referral_tiers
    │
    ├──► public.user_payout_accounts
    │       │ 1:N
    │       └──► public.payout_requests
    │
public.plans (독립 테이블, FK 없음)
public.global_settings (독립 테이블, FK 없음)
```

---

### 마이그레이션 파일 계획

| 파일명 | 내용 | 상태 |
|---|---|---|
| `20260310000001_billing_plans.sql` | `plans` 테이블 생성 + 초기 데이터 | 🔲 |
| `20260310000002_billing_payments.sql` | `payments` 테이블 생성 | 🔲 |
| `20260310000003_referral_tiers.sql` | `referral_tiers` 테이블 생성 + 초기 데이터 | 🔲 |
| `20260310000004_referral_rewards.sql` | `referral_rewards` 테이블 생성 | 🔲 |
| `20260310000005_payout.sql` | `user_payout_accounts` + `payout_requests` 테이블 생성 | 🔲 |
| `20260310000006_global_settings.sql` | `global_settings` 테이블 생성 + 초기값 | 🔲 |
| `20260310000007_users_referral_columns.sql` | `users` 컬럼 추가 + `referral_code` 자동 생성 트리거 | 🔲 |
| `20260310000008_subscriptions_columns.sql` | `subscriptions` 컬럼 추가 | 🔲 |

> **실행 순서:** 001 → 002 → 003 → 004 → 005 → 006 → 007 → 008 (FK 의존성 없어 순서 자유롭지만 위 순서 권장)
