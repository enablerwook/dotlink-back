-- Phase 4: 라이브러리 카드 테이블
CREATE TABLE public.library_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  analysis_id  UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  platform     TEXT CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  thumbnail    TEXT,
  url          TEXT NOT NULL,
  scores       JSONB,
  note         TEXT,
  is_favorite  BOOLEAN DEFAULT false,
  tags         TEXT[] DEFAULT '{}',
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

CREATE INDEX idx_library_user_id ON public.library_cards(user_id);
CREATE INDEX idx_library_created_at ON public.library_cards(created_at DESC);
CREATE INDEX idx_library_platform ON public.library_cards(platform);
