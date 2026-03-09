-- ==========================================================
-- Phase 10 보완: posted_at 추가 + video_duration_sec 정리
--
-- 변경 내용:
--   analyses:
--     - video_duration_sec DROP (미사용 컬럼)
--     - posted_at TIMESTAMPTZ 추가 (Instagram 게시 날짜, Apify timestamp)
--   library_cards:
--     - posted_at TIMESTAMPTZ 추가 (스냅샷)
-- ==========================================================

-- analyses 정리
ALTER TABLE public.analyses DROP COLUMN IF EXISTS video_duration_sec;
ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

-- library_cards 정리
ALTER TABLE public.library_cards ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;
