-- Phase 10: creation_cards 스키마 v2
-- 구 필드(hooking_point, content_structure, differentiation, keywords, ai_insights, draft) 제거
-- 신규 필드(title TEXT, steps JSONB) 추가

ALTER TABLE public.creation_cards
  DROP COLUMN IF EXISTS hooking_point,
  DROP COLUMN IF EXISTS content_structure,
  DROP COLUMN IF EXISTS differentiation,
  DROP COLUMN IF EXISTS keywords,
  DROP COLUMN IF EXISTS ai_insights,
  DROP COLUMN IF EXISTS draft;

ALTER TABLE public.creation_cards
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS steps JSONB NOT NULL DEFAULT '{}'::jsonb;
