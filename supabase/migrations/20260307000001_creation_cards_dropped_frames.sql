-- Phase 11: creation_cards에 dropped_frames JSONB 컬럼 추가
-- 시냅스 Creation Card hook_visual 드래그 앤 드롭 프레임 저장용

ALTER TABLE public.creation_cards
  ADD COLUMN IF NOT EXISTS dropped_frames JSONB NOT NULL DEFAULT '{}'::jsonb;
