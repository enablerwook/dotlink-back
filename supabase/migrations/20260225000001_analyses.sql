-- Phase 3: AI 분석 결과 테이블
CREATE TABLE public.analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  url          TEXT NOT NULL,
  platform     TEXT NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  title        TEXT,
  thumbnail    TEXT,
  transcript   TEXT,
  caption      TEXT,
  scores       JSONB,
  raw_meta     JSONB,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_msg    TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analyses_select_own" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "analyses_insert_own" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_delete_own" ON public.analyses
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_created_at ON public.analyses(created_at DESC);
