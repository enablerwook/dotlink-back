-- Phase 5: 사용량 및 구독 테이블
CREATE TABLE public.usage_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  year_month      TEXT NOT NULL,
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

-- 분석 횟수 원자적 증가 함수
CREATE OR REPLACE FUNCTION public.increment_analysis_count(
  p_user_id UUID,
  p_year_month TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.usage_records (user_id, year_month, analysis_count)
  VALUES (p_user_id, p_year_month, 1)
  ON CONFLICT (user_id, year_month)
  DO UPDATE SET analysis_count = usage_records.analysis_count + 1;
END;
$$;

CREATE TABLE public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'starter'
                       CHECK (plan IN ('starter', 'creator', 'pro')),
  status               TEXT NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end   TIMESTAMPTZ,
  payment_customer_id  TEXT,
  payment_sub_id       TEXT,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
