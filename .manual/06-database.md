# 06. 데이터베이스(Database) 매뉴얼

## 개요

Supabase PostgreSQL 사용. 모든 테이블은 RLS(Row Level Security) 활성화 필수.

**프로젝트**: `[YOUR_PROJECT_REF].supabase.co`

---

## 전체 스키마 요약

자세한 스키마는 `.context/schema.md` 참조.

| 테이블 | 설명 | 상태 |
|---|---|---|
| `auth.users` | Supabase 관리 (직접 수정 금지) | ✅ 존재 |
| `public.users` | 앱 사용자 프로필 | ✅ 생성됨 |
| `public.analyses` | AI 분석 결과 | 🔲 미생성 |
| `public.library_cards` | 라이브러리 카드 | 🔲 미생성 |
| `public.creation_cards` | Creation Card | 🔲 미생성 |
| `public.usage_records` | 월별 사용량 | 🔲 미생성 |
| `public.subscriptions` | 구독 정보 | 🔲 미생성 |

---

## public.users (완성됨)

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

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select_own" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 신규 가입 자동 삽입 트리거
-- handle_new_user() → on_auth_user_created
```

---

## RLS 정책 패턴

모든 테이블에 아래 패턴을 적용합니다:

```sql
-- 1. RLS 활성화
ALTER TABLE public.[테이블명] ENABLE ROW LEVEL SECURITY;

-- 2. SELECT: 본인 데이터만
CREATE POLICY "[테이블]_select_own" ON public.[테이블명]
  FOR SELECT USING (auth.uid() = user_id);

-- 3. INSERT: 본인만 삽입
CREATE POLICY "[테이블]_insert_own" ON public.[테이블명]
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. UPDATE: 본인만 수정
CREATE POLICY "[테이블]_update_own" ON public.[테이블명]
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. DELETE: 본인만 삭제
CREATE POLICY "[테이블]_delete_own" ON public.[테이블명]
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 마이그레이션 파일 위치

```
supabase/migrations/
├── 20260224000000_init_users.sql      ✅ 실행됨
├── 20260225000001_analyses.sql        🔲 미생성
├── 20260225000002_library_cards.sql   🔲 미생성
├── 20260225000003_creation_cards.sql  🔲 미생성
└── 20260225000004_billing.sql         🔲 미생성
```

마이그레이션 파일명: `YYYYMMDDHHMMSS_[설명].sql`

---

## Supabase 클라이언트 사용 규칙

| 컨텍스트 | 파일 | 이유 |
|---|---|---|
| 클라이언트 컴포넌트 | `infrastructure/supabase/client.ts` | 쿠키 접근 불가 |
| 서버 컴포넌트 | `infrastructure/supabase/server.ts` | 쿠키 기반 세션 |
| API Route | `infrastructure/supabase/server.ts` | 서버 환경 |
| Server Action | `infrastructure/supabase/server.ts` | 서버 환경 |
| Middleware | `@supabase/ssr` 직접 | Next.js 엣지 런타임 |

---

## JSONB 활용

DNA 분석 점수는 `JSONB`로 저장하여 스키마 변경 없이 확장 가능:

```json
{
  "hooking_video": { "score": 8, "description": "강렬한 오프닝 컷" },
  "hooking_text": { "score": 7, "description": "질문형 첫 자막" },
  "script_appeal": { "score": 9, "description": "자연스러운 스토리텔링" },
  ...
}
```

---

## 환경 변수

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # 클라이언트용 (공개 가능)
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # 서버 전용 (절대 공개 금지)
```
