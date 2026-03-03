# 03. 데이터 사전 (Data Dictionary)

> Last Updated: 2026-02-25
> Source: 코드 자동 분석 (`supabase/migrations/`, `domains/*/types.ts`, `lib/types.ts`)

---

## 목차

- [1. public.users](#1-publicusers)
- [2. public.analyses](#2-publicanalyses)
- [3. public.library_cards](#3-publiclibrary_cards)
- [4. public.creation_cards](#4-publiccreation_cards)
- [5. public.usage_records](#5-publicusage_records)
- [6. public.subscriptions](#6-publicsubscriptions)
- [7. JSONB 스키마 상세](#7-jsonb-스키마-상세)
- [8. Enum / 상수 정의](#8-enum--상수-정의)

---

## 1. public.users

**설명**: Supabase Auth 사용자와 1:1로 연결되는 사용자 프로필 테이블. 회원가입 시 트리거로 자동 생성됨.

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 제약조건 | 비즈니스 의미 |
|---|---|---|---|---|---|
| `id` | UUID | NO | — | PK, FK → `auth.users(id)` ON DELETE CASCADE | Supabase 인증 사용자 ID와 동일 |
| `email` | TEXT | NO | — | NOT NULL | 사용자 이메일 주소 |
| `full_name` | TEXT | YES | NULL | — | 표시 이름 (Google OAuth: 실명, 이메일: 입력값) |
| `avatar_url` | TEXT | YES | NULL | — | 프로필 이미지 URL (Google OAuth에서 자동 설정) |
| `plan` | TEXT | YES | `'starter'` | CHECK (`'starter'`, `'creator'`, `'pro'`) | 현재 구독 플랜 |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — | 사용자 생성 일시 |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — | 사용자 정보 수정 일시 |

---

## 2. public.analyses

**설명**: Apify 크롤링 + Google Gemini AI가 생성한 9차원 콘텐츠 분석 결과를 저장하는 테이블.

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 제약조건 | 비즈니스 의미 |
|---|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK | 분석 고유 식별자 |
| `user_id` | UUID | NO | — | FK → `public.users(id)` ON DELETE CASCADE | 분석을 요청한 사용자 |
| `url` | TEXT | NO | — | NOT NULL | 분석 대상 콘텐츠 URL |
| `platform` | TEXT | NO | — | CHECK (`'instagram'`, `'tiktok'`, `'youtube'`) | 콘텐츠 플랫폼 종류 |
| `title` | TEXT | YES | NULL | — | Apify가 크롤링한 콘텐츠 제목 |
| `thumbnail` | TEXT | YES | NULL | — | 콘텐츠 썸네일/대표 이미지 URL |
| `transcript` | TEXT | YES | NULL | — | 음성→텍스트 변환 결과 (Apify 제공 또는 Whisper STT) |
| `caption` | TEXT | YES | NULL | — | 원본 캡션/설명 텍스트 |
| `scores` | JSONB | YES | NULL | — | 9차원 AI 분석 결과 객체 (상세 스키마 [§7](#7-jsonb-스키마-상세) 참조) |
| `raw_meta` | JSONB | YES | NULL | — | Apify가 반환한 원본 크롤링 데이터 (디버깅용) |
| `status` | TEXT | YES | `'pending'` | CHECK (`'pending'`, `'processing'`, `'completed'`, `'failed'`) | 분석 파이프라인 진행 상태 |
| `error_msg` | TEXT | YES | NULL | — | 분석 실패 시 에러 메시지 |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — | 분석 요청 일시 |

**status 상태 흐름**:
```
pending → processing → completed
                    → failed (error_msg에 원인 기록)
```

---

## 3. public.library_cards

**설명**: 사용자가 분석 결과를 저장한 라이브러리 카드. `analyses`의 핵심 정보를 복사하여 독립적으로 관리됨. 원본 분석이 삭제되어도 카드는 유지됨.

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 제약조건 | 비즈니스 의미 |
|---|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK | 라이브러리 카드 고유 식별자 |
| `user_id` | UUID | NO | — | FK → `public.users(id)` ON DELETE CASCADE | 카드 소유자 |
| `analysis_id` | UUID | YES | NULL | FK → `public.analyses(id)` ON DELETE SET NULL | 원본 분석 참조 (분석 삭제 시 NULL) |
| `title` | TEXT | NO | — | NOT NULL | 카드 제목 (분석 title에서 복사) |
| `platform` | TEXT | NO | — | CHECK (`'instagram'`, `'tiktok'`, `'youtube'`) | 플랫폼 종류 |
| `thumbnail` | TEXT | YES | NULL | — | 썸네일 URL |
| `url` | TEXT | NO | — | NOT NULL | 원본 콘텐츠 URL |
| `scores` | JSONB | YES | NULL | — | 9차원 분석 점수 복사본 (analyses.scores와 동일 구조) |
| `note` | TEXT | YES | NULL | — | 사용자가 직접 입력한 메모 |
| `is_favorite` | BOOLEAN | YES | `false` | — | 즐겨찾기 여부 |
| `tags` | TEXT[] | YES | `'{}'` | — | 사용자 정의 태그 배열 |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — | 저장 일시 |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — | 수정 일시 (메모/즐겨찾기 변경 시 업데이트) |

---

## 4. public.creation_cards

**설명**: 두 LibraryCard를 Gemini AI가 비교 분석하여 생성하는 대본/기획 카드. 시냅스 도메인의 핵심 출력물.

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 제약조건 | 비즈니스 의미 |
|---|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK | Creation Card 고유 식별자 |
| `user_id` | UUID | NO | — | FK → `public.users(id)` ON DELETE CASCADE | 카드 소유자 |
| `source_card_a_id` | UUID | YES | NULL | FK → `public.library_cards(id)` ON DELETE SET NULL | 비교에 사용된 카드 A |
| `source_card_b_id` | UUID | YES | NULL | FK → `public.library_cards(id)` ON DELETE SET NULL | 비교에 사용된 카드 B |
| `hooking_point` | TEXT | YES | NULL | — | 3초 내 시선을 끄는 후킹 포인트 (AI 생성) |
| `content_structure` | TEXT | YES | NULL | — | 콘텐츠 스토리보드/구조 (AI 생성) |
| `differentiation` | TEXT | YES | NULL | — | 차별화 포지셔닝 전략 (AI 생성) |
| `keywords` | TEXT[] | YES | `'{}'` | — | 핵심 키워드 배열 (AI 추출) |
| `ai_insights` | TEXT | YES | NULL | — | Gemini 두 콘텐츠 비교 분석 인사이트 |
| `draft` | TEXT | YES | NULL | — | 완성된 대본 초안 (향후 구현) |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — | 생성 일시 |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — | 수정 일시 |

---

## 5. public.usage_records

**설명**: 월별 API 사용량을 추적하는 테이블. UPSERT 방식으로 원자적 카운터 증가를 지원함.

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 제약조건 | 비즈니스 의미 |
|---|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK | 레코드 고유 식별자 |
| `user_id` | UUID | NO | — | FK → `public.users(id)` ON DELETE CASCADE | 사용자 |
| `year_month` | TEXT | NO | — | NOT NULL, UNIQUE(user_id, year_month) | 연월 식별자 (예: `'2026-02'`) |
| `analysis_count` | INTEGER | YES | `0` | — | 해당 월 AI 분석 실행 횟수 |

**주의**: `(user_id, year_month)` 복합 UNIQUE 제약이 인덱스 역할을 겸함.

---

## 6. public.subscriptions

**설명**: 사용자의 유료 구독 정보를 관리하는 테이블. 결제 연동 시 `payment_customer_id`, `payment_sub_id`가 사용됨.

| 컬럼명 | 데이터 타입 | NULL 허용 | 기본값 | 제약조건 | 비즈니스 의미 |
|---|---|---|---|---|---|
| `id` | UUID | NO | `gen_random_uuid()` | PK | 구독 레코드 고유 식별자 |
| `user_id` | UUID | NO | — | FK → `public.users(id)` ON DELETE CASCADE, UNIQUE | 구독 소유자 (1인 1구독) |
| `plan` | TEXT | YES | `'starter'` | — | 현재 구독 플랜 |
| `status` | TEXT | YES | `'active'` | — | `active` / `canceled` / `past_due` |
| `current_period_end` | TIMESTAMPTZ | YES | NULL | — | 현재 구독 기간 종료일 |
| `payment_customer_id` | TEXT | YES | NULL | — | 결제 게이트웨이 고객 ID |
| `payment_sub_id` | TEXT | YES | NULL | — | 결제 게이트웨이 구독 ID |
| `created_at` | TIMESTAMPTZ | YES | `now()` | — | 구독 생성 일시 |
| `updated_at` | TIMESTAMPTZ | YES | `now()` | — | 구독 정보 수정 일시 |

---

## 7. JSONB 스키마 상세

### analyses.scores / library_cards.scores — AnalysisResult

```typescript
interface AnalysisResult {
  hookVisual: string         // 3초 내 시선을 끄는 영상 요소 (Gemini 생성 텍스트)
  hookText: string           // 3초 내 시선을 끄는 텍스트/자막 (Gemini 생성 텍스트)
  scriptAppeal: string       // 전체 스크립트 매력도 분석 (Gemini 생성 텍스트)
  captionAnalysis: string    // 캡션 구성 분석 (Gemini 생성 텍스트)
  visualDirection: string    // 영상미와 연출 스타일 분석 (Gemini 생성 텍스트)
  engagementDevices: string  // 댓글/저장/공유 유도 장치 분석 (Gemini 생성 텍스트)
  contentType: string        // 콘텐츠 유형 분류 (Gemini 생성 텍스트)
  salesPoints: string        // 세일즈/소구점 분석 (Gemini 생성 텍스트)
  difficulty: {
    planning: number         // 기획 난이도 1~5
    filming: number          // 촬영 난이도 1~5
    editing: number          // 편집 난이도 1~5
  }
}
```

**예시 데이터**:
```json
{
  "hookVisual": "영상 시작 0.5초 내에 제품 클로즈업 쇼트로 시선 고정, 빠른 화면 전환으로 호기심 유발",
  "hookText": "'이거 알고 있었어?'라는 질문형 텍스트로 시청자 참여 유도",
  "scriptAppeal": "문제 제기 → 해결책 제시 → 감정적 공감의 3단 구조. CTA 명확",
  "captionAnalysis": "핵심 키워드 3개 포함, 이모지 2개로 시각적 흥미 부여",
  "visualDirection": "자연광 활용, 미니멀 배경, 세로 9:16 최적화",
  "engagementDevices": "댓글 유도 질문 삽입, 저장 유도 '나중에 쓸 수도' 표현",
  "contentType": "정보성 (How-to) + 감성 결합형",
  "salesPoints": "문제 해결형 소구, 즉각적 가치 제안",
  "difficulty": {
    "planning": 3,
    "filming": 2,
    "editing": 4
  }
}
```

### analyses.raw_meta — ApifyResult

```typescript
interface ApifyResult {
  title?: string
  description?: string        // 캡션 원문
  hashtags?: string[]
  displayUrl?: string         // 썸네일 URL
  videoDuration?: number      // 영상 길이 (초)
  videoPlayCount?: number     // 재생 수
  videoViewCount?: number     // 조회 수
  likesCount?: number         // 좋아요 수
  transcript?: string         // Apify가 추출한 자막/텍스트
  videoUrl?: string           // 영상 다운로드 URL (Phase 8에서 활용)
}
```

---

## 8. Enum / 상수 정의

### Platform

```typescript
type Platform = 'instagram' | 'tiktok' | 'youtube'
```

| 값 | 지원 상태 | 설명 |
|---|---|---|
| `instagram` | ✅ 지원 | Apify `instagram-reel-scraper` Actor 사용 |
| `tiktok` | 🔲 미지원 | UI disabled, 코드에서 에러 throw |
| `youtube` | 🔲 미지원 | UI disabled, 코드에서 에러 throw |

### Plan

```typescript
type Plan = 'starter' | 'creator' | 'pro'
```

| 값 | 월 요금 | 월간 분석 | 라이브러리 | 팀원 수 |
|---|---|---|---|---|
| `starter` | 무료 | 5회 | 10개 | 1명 |
| `creator` | ₩29,000 | 50회 | 무제한 | 1명 |
| `pro` | ₩59,000 | 무제한 | 무제한 | 5명 |

### AnalysisStatus

```typescript
type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed'
```

| 값 | 설명 |
|---|---|
| `pending` | 분석 요청 접수, 파이프라인 시작 전 |
| `processing` | Apify 크롤링 또는 Gemini 분석 진행 중 |
| `completed` | 분석 완료, `scores` 필드에 결과 저장됨 |
| `failed` | 분석 실패, `error_msg` 필드에 원인 기록 |

### SubscriptionStatus

```typescript
type SubscriptionStatus = 'active' | 'canceled' | 'past_due'
```

| 값 | 설명 |
|---|---|
| `active` | 정상 구독 중 |
| `canceled` | 취소된 구독 (기간 만료 전까지는 서비스 이용 가능) |
| `past_due` | 결제 실패로 미납 상태 |

### year_month 형식

- **포맷**: `'YYYY-MM'` (예: `'2026-02'`)
- **코드에서 생성**:
  ```typescript
  const yearMonth = new Date().toISOString().slice(0, 7) // '2026-02'
  ```
- **RPC 함수에서 활용**:
  ```sql
  SELECT * FROM usage_records WHERE user_id = $1 AND year_month = '2026-02'
  ```

> **참고 문서**: [02_erd.md](./02_erd.md) | [01_domain_model.md](./01_domain_model.md) | [07_business_rules.md](./07_business_rules.md)
