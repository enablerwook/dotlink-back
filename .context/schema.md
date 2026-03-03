# DB 스키마 전체 정의

_최종 업데이트: 2026-03-01_
_Supabase 프로젝트: dahuhzldlvdnrqfxbqcp.supabase.co_

---

## 테이블 목록 및 상태

| 테이블 | 설명 | 상태 | 마이그레이션 파일 |
|---|---|---|---|
| `auth.users` | Supabase 관리 (직접 수정 금지) | ✅ 존재 | — |
| `public.users` | 앱 사용자 프로필 | ✅ 생성됨 | `20260224000000_init_users.sql` |
| `public.analyses` | AI 분석 결과 | 🔲 미생성 | `20260225000001_analyses.sql` |
| `public.library_cards` | 라이브러리 카드 | 🔲 미생성 | `20260225000002_library_cards.sql` |
| `public.creation_cards` | Creation Card | 🔲 미생성 | `20260225000003_creation_cards.sql` |
| `public.usage_records` | 월별 사용량 | 🔲 미생성 | `20260225000004_billing.sql` |
| `public.subscriptions` | 구독 정보 | 🔲 미생성 | `20260225000004_billing.sql` |

---

## 테이블 상세 스키마

### 1. public.users ✅ (완성됨)

```sql
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  plan        TEXT NOT NULL DEFAULT 'starter'
              CHECK (plan IN ('starter', 'creator', 'pro')),
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- 트리거: auth.users INSERT 시 자동 삽입
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id, NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

### 2. public.analyses 🔲 (미생성)

```sql
-- supabase/migrations/20260225000001_analyses.sql

CREATE TABLE public.analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  platform     TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  title        TEXT,
  thumbnail    TEXT,
  transcript   TEXT,                -- 음성→텍스트 변환 결과
  caption      TEXT,                -- 원본 캡션/해시태그
  scores       JSONB,               -- DNA 9차원 점수 (구조 아래 참조)
  raw_meta     JSONB,               -- Apify 원본 메타데이터
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_msg    TEXT,                -- 실패 시 에러 메시지
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analyses_select_own" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "analyses_insert_own" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_delete_own" ON public.analyses
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
```

**scores JSONB 구조 (Phase 9 확정):**

> 각 필드의 데이터 출처: Apify(크롤링), Whisper(음성→텍스트), Gemini(AI 분석)

```json
{
  "hook_analysis": "강렬한 클로즈업 컷으로 시작. 0.3초 내 시선 고정 전략 사용.",
  "hook_text": "질문형 첫 자막 '이거 알고 있었어?'. 즉각적 호기심 유발 구조.",
  "full_script": "안녕하세요 오늘은... (Whisper STT 전체 대본)",
  "caption": "#릴스 #일상 #꿀팁 오늘의 꿀팁 공유합니다! 👇 저장 필수",
  "production_note": "핸드헬드 촬영, 0.5~1초 빠른 컷 전환. 자연광 활용. 자막은 하단 중앙 고정.",
  "engagement": {
    "metrics": {
      "likes": 12000,
      "views": 340000,
      "comments": 450,
      "shares": 0
    },
    "analysis": "높은 조회수 대비 댓글 비율 낮음. 정보 소비형 콘텐츠 특성. 저장율 높을 것으로 추정."
  },
  "content_type": "정보형 / 튜토리얼",
  "selling_point": "소프트셀 전략. 링크 유도 CTA 포함. 직접 제품 언급 없음.",
  "difficulty": {
    "planning": 3,
    "filming": 2,
    "editing": 4
  }
}
```

**필드별 데이터 출처 요약:**

| 필드 | 출처 | 비고 |
|---|---|---|
| `hook_analysis` | Gemini | 프레임 + 대본 기반 시각적 분석 |
| `hook_text` | Gemini | 대본 첫 줄 기반 텍스트 전략 분석 |
| `full_script` | Whisper STT | videoUrl 없거나 음성 없으면 `""` |
| `caption` | Apify | `description` 필드 그대로 사용 |
| `production_note` | Gemini | 프레임 + 대본 기반 촬영/편집 스타일 |
| `engagement.metrics` | Apify | `likeCount`, `viewCount`, `commentCount`, `saveCount` |
| `engagement.analysis` | Gemini | metrics 데이터 기반 AI 해석 |
| `content_type` | Gemini | 콘텐츠 유형 분류 (텍스트) |
| `selling_point` | Gemini | 판매/설득 전략 분석 |
| `difficulty` | Gemini | 기획/촬영/편집 난이도 1~5 숫자 |

---

### 3. public.library_cards 🔲 (미생성)

```sql
-- supabase/migrations/20260225000002_library_cards.sql

CREATE TABLE public.library_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  analysis_id  UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  platform     TEXT CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  thumbnail    TEXT,
  url          TEXT NOT NULL,
  scores       JSONB,               -- analyses.scores 복사 (조회 성능)
  note         TEXT,                -- 사용자 메모
  is_favorite  BOOLEAN DEFAULT false,
  tags         TEXT[] DEFAULT '{}', -- 사용자 태그
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.library_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "library_select_own" ON public.library_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "library_insert_own" ON public.library_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "library_update_own" ON public.library_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "library_delete_own" ON public.library_cards
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_library_user_id ON public.library_cards(user_id);
CREATE INDEX idx_library_created_at ON public.library_cards(created_at DESC);
CREATE INDEX idx_library_platform ON public.library_cards(platform);
CREATE INDEX idx_library_favorite ON public.library_cards(is_favorite) WHERE is_favorite = true;
```

---

### 4. public.creation_cards 🔲 (미생성)

```sql
-- supabase/migrations/20260225000003_creation_cards.sql

CREATE TABLE public.creation_cards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_card_a_id  UUID REFERENCES public.library_cards(id) ON DELETE SET NULL,
  source_card_b_id  UUID REFERENCES public.library_cards(id) ON DELETE SET NULL,
  hooking_point     TEXT,           -- 참고한 후킹 포인트
  content_structure TEXT,           -- 가져갈 구조
  differentiation   TEXT,           -- 나만의 차별화
  keywords          TEXT[] DEFAULT '{}', -- 타깃 키워드/해시태그
  ai_insights       TEXT,           -- AI 비교 분석 결과 (Gemini)
  draft             TEXT,           -- 완성된 대본 (향후)
  created_at        TIMESTAMPTZ DEFAULT now(),
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.creation_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creation_select_own" ON public.creation_cards
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "creation_insert_own" ON public.creation_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creation_update_own" ON public.creation_cards
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "creation_delete_own" ON public.creation_cards
  FOR DELETE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_creation_user_id ON public.creation_cards(user_id);
CREATE INDEX idx_creation_created_at ON public.creation_cards(created_at DESC);
```

---

### 5. public.usage_records 🔲 (미생성)

```sql
-- supabase/migrations/20260225000004_billing.sql (파트 1)

CREATE TABLE public.usage_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year_month      TEXT NOT NULL,    -- 'YYYY-MM' 형식 (예: '2026-02')
  analysis_count  INT DEFAULT 0,
  UNIQUE(user_id, year_month)
);

ALTER TABLE public.usage_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_select_own" ON public.usage_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "usage_insert_own" ON public.usage_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usage_update_own" ON public.usage_records
  FOR UPDATE USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_usage_user_month ON public.usage_records(user_id, year_month);
```

---

### 6. public.subscriptions 🔲 (미생성)

```sql
-- supabase/migrations/20260225000004_billing.sql (파트 2)

CREATE TABLE public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'starter'
                       CHECK (plan IN ('starter', 'creator', 'pro')),
  status               TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end   TIMESTAMPTZ,
  payment_customer_id  TEXT,        -- 결제 게이트웨이 고객 ID
  payment_sub_id       TEXT,        -- 결제 게이트웨이 구독 ID
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- 구독 상태 변경은 서비스 역할(service role)만 가능 (웹훅 처리)
-- 일반 사용자 UPDATE 정책 없음 (의도적)
```

---

## ERD (Entity Relationship Diagram)

```
auth.users (Supabase 관리)
    │
    ▼ 1:1 (트리거)
public.users
    │ 1:N
    ├──► public.analyses
    │       │ 1:1
    │       ▼
    │    public.library_cards ──────────────┐
    │                                        │ N:1 (source_card_a)
    │                                        │ N:1 (source_card_b)
    │                                        ▼
    ├──► public.creation_cards ◄────────────┘
    ├──► public.usage_records
    └──► public.subscriptions
```

---

## 마이그레이션 실행 순서

반드시 이 순서대로 실행 (FK 의존성):

1. `20260224000000_init_users.sql` ✅ (이미 실행됨)
2. `20260225000001_analyses.sql`
3. `20260225000002_library_cards.sql` (analyses FK 필요)
4. `20260225000003_creation_cards.sql` (library_cards FK 필요)
5. `20260225000004_billing.sql` (users FK만 필요)

Supabase MCP로 실행: `apply_migration` 도구 사용
