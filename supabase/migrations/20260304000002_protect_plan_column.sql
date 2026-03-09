-- ==========================================================
-- DotLink: plan 컬럼 자가 업그레이드 방지
--
-- 문제: users_update_own 정책이 plan을 포함한 모든 컬럼 수정을 허용함
-- 해결: 컬럼 수준 권한 회수 + 프로필 전용 업데이트 정책 재생성
--
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- ==========================================================

-- ─────────────────────────────────────────────────────────
-- Step 1. 기존 전면 허용 정책 제거
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_update_own" ON public.users;

-- ─────────────────────────────────────────────────────────
-- Step 2. 프로필 수정 전용 정책 재생성
--   · USING  : 본인 레코드에만 UPDATE 시도 가능
--   · WITH CHECK : UPDATE 후 id가 바뀌지 않음을 보장
-- ─────────────────────────────────────────────────────────
CREATE POLICY "users_update_profile"
  ON public.users
  FOR UPDATE
  USING     (auth.uid() = id)
  WITH CHECK(auth.uid() = id);

-- ─────────────────────────────────────────────────────────
-- Step 3. 클라이언트 역할(authenticated)에서 plan 컬럼 UPDATE 권한 회수
--   · RLS는 행 단위 제어, 컬럼 단위 제어는 column privilege로 처리
--   · 이 REVOKE 이후 authenticated 역할은 plan 컬럼을 직접 쓸 수 없음
--   · service_role은 BYPASSRLS + 별도 superuser 수준 → 영향 없음
-- ─────────────────────────────────────────────────────────
REVOKE UPDATE (plan) ON public.users FROM authenticated;
REVOKE UPDATE (plan) ON public.users FROM anon;

-- ─────────────────────────────────────────────────────────
-- Step 4. 서버 전용 plan 변경 함수 (결제 웹훅에서만 호출)
--   · SECURITY DEFINER : 함수 소유자 권한으로 실행 (plan 컬럼 접근 가능)
--   · authenticated / anon EXECUTE 권한 명시적 박탈
--   · 서버 사이드(service_role 키)에서만 supabase.rpc("update_user_plan") 호출 가능
-- ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_user_plan(
  p_user_id UUID,
  p_plan    TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 허용된 플랜 값만 처리 (방어적 검증)
  IF p_plan NOT IN ('starter', 'creator', 'pro') THEN
    RAISE EXCEPTION 'update_user_plan: 유효하지 않은 플랜 값 "%"', p_plan;
  END IF;

  UPDATE public.users
  SET
    plan       = p_plan,
    updated_at = now()
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'update_user_plan: 사용자를 찾을 수 없습니다 (id=%)', p_user_id;
  END IF;
END;
$$;

-- 클라이언트 역할 실행 권한 박탈 (DEFAULT DENY 원칙)
REVOKE EXECUTE ON FUNCTION public.update_user_plan(UUID, TEXT) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.update_user_plan(UUID, TEXT) FROM anon;

-- ─────────────────────────────────────────────────────────
-- 검증 쿼리 (실행 후 아래 결과가 나와야 정상)
--
-- SELECT grantee, privilege_type, column_name
-- FROM information_schema.column_privileges
-- WHERE table_name = 'users' AND column_name = 'plan';
--
-- 기대 결과: authenticated / anon 행에 UPDATE 없음
-- ─────────────────────────────────────────────────────────
