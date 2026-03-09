-- ==========================================================
-- Phase 10: Schema v3 — Analysis 구조 전면 개편
--
-- 변경 내용:
--   analyses:
--     - scores JSONB / raw_meta JSONB 제거
--     - thumbnail -> thumbnail_url 리네임
--     - full_script -> script 리네임
--     - 탭별 독립 컬럼 추가 (hooking, content_type, production,
--       selling_point, difficulty, engagement_analysis)
--     - Apify 지표 컬럼 추가 (like_count, view_count, comment_count, video_duration_sec)
--     - updated_at 컬럼 + 자동 갱신 트리거 추가
--   library_cards:
--     - scores JSONB / is_favorite / tags 제거
--     - thumbnail -> thumbnail_url 리네임
--     - analysis_id: NOT NULL 해제, ON DELETE CASCADE -> SET NULL (Snapshot 패턴)
--     - Snapshot 컬럼 추가 (hooking, content_type, production, selling_point,
--       difficulty, engagement_analysis, caption, script,
--       like_count, view_count, comment_count)
-- ==========================================================

-- ─────────────────────────────────────────────────────────
-- 0. updated_at 자동 갱신 공통 트리거 함수
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────
-- 1. analyses 테이블 수정
-- ─────────────────────────────────────────────────────────

-- 1-1. 리네임
ALTER TABLE public.analyses RENAME COLUMN thumbnail  TO thumbnail_url;
ALTER TABLE public.analyses RENAME COLUMN full_script TO script;

-- 1-2. 불필요한 컬럼 제거 (데이터 소스 혼합 JSONB → 개별 컬럼으로 대체)
ALTER TABLE public.analyses DROP COLUMN IF EXISTS scores;
ALTER TABLE public.analyses DROP COLUMN IF EXISTS raw_meta;

-- 1-3. Apify 지표 컬럼 추가
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS like_count          BIGINT;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS view_count          BIGINT;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS comment_count       BIGINT;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS video_duration_sec  INT;

-- 1-4. Gemini 분석 컬럼 추가
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS hooking             TEXT;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS content_type        TEXT;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS production          TEXT;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS selling_point       TEXT;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS difficulty          JSONB;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS engagement_analysis TEXT;

-- 1-5. updated_at 컬럼 추가 + 트리거 등록
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

DROP TRIGGER IF EXISTS trg_analyses_updated_at ON public.analyses;
CREATE TRIGGER trg_analyses_updated_at
  BEFORE UPDATE ON public.analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────
-- 2. library_cards 테이블 수정
-- ─────────────────────────────────────────────────────────

-- 2-1. 리네임
ALTER TABLE public.library_cards RENAME COLUMN thumbnail TO thumbnail_url;

-- 2-2. 불필요한 컬럼 제거
ALTER TABLE public.library_cards DROP COLUMN IF EXISTS scores;
ALTER TABLE public.library_cards DROP COLUMN IF EXISTS is_favorite;
ALTER TABLE public.library_cards DROP COLUMN IF EXISTS tags;
ALTER TABLE public.library_cards DROP COLUMN IF EXISTS note;

-- 2-3. analysis_id FK 수정 (NOT NULL 해제 + ON DELETE SET NULL)
--   Snapshot 패턴: 원본 분석이 삭제되어도 라이브러리 카드는 유지
ALTER TABLE public.library_cards ALTER COLUMN analysis_id DROP NOT NULL;

ALTER TABLE public.library_cards
  DROP CONSTRAINT IF EXISTS library_cards_analysis_id_fkey;

ALTER TABLE public.library_cards
  ADD CONSTRAINT library_cards_analysis_id_fkey
  FOREIGN KEY (analysis_id) REFERENCES public.analyses(id) ON DELETE SET NULL;

-- 2-4. Snapshot 컬럼 추가
--   caption은 이미 존재할 수 있으므로 IF NOT EXISTS 사용
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS caption             TEXT;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS script              TEXT;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS hooking             TEXT;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS content_type        TEXT;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS production          TEXT;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS selling_point       TEXT;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS difficulty          JSONB;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS engagement_analysis TEXT;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS like_count          BIGINT;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS view_count          BIGINT;
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS comment_count       BIGINT;

-- 2-5. updated_at 트리거 등록 (컬럼은 이미 존재)
DROP TRIGGER IF EXISTS trg_library_cards_updated_at ON public.library_cards;
CREATE TRIGGER trg_library_cards_updated_at
  BEFORE UPDATE ON public.library_cards
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────
-- 3. users 테이블 updated_at 트리거 등록
-- ─────────────────────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─────────────────────────────────────────────────────────
-- 4. usage_records RLS 강화
--    클라이언트 직접 insert/update 차단 (SECURITY DEFINER 함수만 허용)
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "usage_insert_own" ON public.usage_records;
DROP POLICY IF EXISTS "usage_update_own" ON public.usage_records;

-- ─────────────────────────────────────────────────────────
-- 검증 쿼리 (실행 후 아래로 확인)
--
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'analyses'
-- ORDER BY ordinal_position;
--
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'library_cards'
-- ORDER BY ordinal_position;
-- ─────────────────────────────────────────────────────────
