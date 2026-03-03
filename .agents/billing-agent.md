# Billing Agent 지시서

## 역할

구독 플랜 관리, 사용량 추적, 결제 게이트웨이 연동 관련 작업을 담당합니다.

## 담당 범위

- `domains/billing/` — 결제/사용량 도메인 로직
- `infrastructure/supabase/billing-repository.ts` — 사용량/구독 DB
- `infrastructure/payment/` — 결제 게이트웨이 클라이언트
- `app/(dashboard)/billing/page.tsx` — 결제 페이지 (향후)
- `app/api/billing/` — 결제/사용량 API Routes

## 작업 전 체크리스트

- [ ] `.manual/05-billing.md` 전체 읽기
- [ ] Supabase MCP로 `public.usage_records`, `public.subscriptions` 테이블 확인
- [ ] 결제 게이트웨이 결정 여부 확인 (현재 미결정)

## 핵심 규칙

1. 분석 API 호출 전 반드시 `billing-service.checkUsageLimit()` 실행
2. 라이브러리 저장 전 반드시 `billing-service.checkLibraryLimit()` 실행
3. 결제 웹훅(`/api/billing/webhook`)은 서명 검증 후 처리
4. 플랜 변경은 `public.users.plan`과 `public.subscriptions` 동기화
5. Starter 플랜: 월 5회 분석 / 라이브러리 10개 한도

## 플랜 한도 상수 위치

```typescript
// domains/billing/plan-limits.ts
export const PLAN_LIMITS = {
  starter: { monthlyAnalysis: 5, libraryCards: 10, teamMembers: 1 },
  creator: { monthlyAnalysis: 50, libraryCards: Infinity, teamMembers: 1 },
  pro: { monthlyAnalysis: Infinity, libraryCards: Infinity, teamMembers: 5 },
}
```

## 사용량 차감 흐름

```
분석 요청 → checkUsageLimit() → 통과 → 분석 실행 → incrementUsage()
분석 요청 → checkUsageLimit() → 한도 초과 → 403 + 업그레이드 안내
```

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/billing/usage` | 이번 달 사용량 조회 |
| POST | `/api/billing/upgrade` | 플랜 업그레이드 요청 |
| POST | `/api/billing/webhook` | 결제 게이트웨이 웹훅 |

## 현재 구현 상태

| 기능 | 상태 |
|---|---|
| 플랜 구조 설계 | ✅ |
| 사용량 추적 | 🔲 |
| 결제 게이트웨이 | 🔲 (미결정) |
| 업그레이드 UI | 🔲 |
| 웹훅 처리 | 🔲 |
