-- Phase 9 Schema v2
-- 1. analyses.transcript 컬럼을 full_script으로 rename (도메인 필드명 일치)
-- 2. analyses에 frames JSONB 컬럼 추가 (Storage 이미지 URL 배열 저장)
-- 3. library_cards에 frames JSONB 컬럼 추가 (라이브러리 탭 이미지 노출)

-- 1) transcript → full_script rename
ALTER TABLE public.analyses RENAME COLUMN transcript TO full_script;

-- 2) analyses frames 컬럼 추가
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS frames JSONB;

-- 3) library_cards frames 컬럼 추가
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS frames JSONB;
