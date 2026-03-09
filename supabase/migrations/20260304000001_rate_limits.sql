-- Rate Limiting
-- 요청 버스트 공격 방어: 단위 시간 내 최대 요청 수 원자적 체크+카운트
-- TOCTOU 방지: INSERT ... ON CONFLICT DO UPDATE 는 PostgreSQL에서 완전히 원자적

CREATE TABLE public.rate_limits (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  endpoint      TEXT        NOT NULL,           -- 'analysis' | 'library'
  window_start  TIMESTAMPTZ NOT NULL,           -- 윈도우 시작 시각 (에포크 기반)
  request_count INT         NOT NULL DEFAULT 1,
  UNIQUE (user_id, endpoint, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 rate_limit 레코드만 조회 가능 (쓰기는 SECURITY DEFINER 함수만)
CREATE POLICY "rate_limits_select_own" ON public.rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- check_and_increment_rate_limit
-- 원자적으로 카운트를 증가시키고, 허용 여부(BOOLEAN)를 반환합니다.
--
-- p_max_requests  : 윈도우 내 허용 최대 요청 수
-- p_window_seconds: 윈도우 크기 (초 단위, 예: 60 = 1분)
-- RETURNS TRUE    : 요청 허용 (현재 카운트 <= max)
-- RETURNS FALSE   : 요청 차단 (현재 카운트 > max)
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  p_user_id        UUID,
  p_endpoint       TEXT,
  p_max_requests   INT,
  p_window_seconds INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window_start  TIMESTAMPTZ;
  v_new_count     INT;
BEGIN
  -- 에포크 기반 윈도우 버킷 계산 (floor 나눗셈으로 고정 버킷 생성)
  v_window_start := to_timestamp(
    floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds
  );

  -- 원자적 upsert: 존재하면 카운트 증가, 없으면 1로 삽입
  INSERT INTO public.rate_limits (user_id, endpoint, window_start, request_count)
  VALUES (p_user_id, p_endpoint, v_window_start, 1)
  ON CONFLICT (user_id, endpoint, window_start)
  DO UPDATE SET request_count = rate_limits.request_count + 1
  RETURNING request_count INTO v_new_count;

  RETURN v_new_count <= p_max_requests;
END;
$$;
