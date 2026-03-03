-- Phase 6: Creation Card 테이블
CREATE TABLE public.creation_cards (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_card_a_id  UUID REFERENCES public.library_cards(id) ON DELETE SET NULL,
  source_card_b_id  UUID REFERENCES public.library_cards(id) ON DELETE SET NULL,
  hooking_point     TEXT,
  content_structure TEXT,
  differentiation   TEXT,
  keywords          TEXT[] DEFAULT '{}',
  ai_insights       TEXT,
  draft             TEXT,
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

CREATE INDEX idx_creation_user_id ON public.creation_cards(user_id);
CREATE INDEX idx_creation_created_at ON public.creation_cards(created_at DESC);
