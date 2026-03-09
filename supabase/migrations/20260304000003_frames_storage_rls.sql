-- ==========================================================
-- DotLink: frames 스토리지 버킷 RLS — 소유자만 접근
--
-- 경로 구조: {userId}/{analysisId}/frame-{n}.jpg
-- 규칙: 첫 번째 폴더(userId)가 로그인한 사용자 ID와 일치해야 접근 가능
--
-- 실행 위치: Supabase 대시보드 > SQL Editor
-- ==========================================================

-- ─────────────────────────────────────────────────────────
-- Step 1. frames 버킷 비공개 전환
--   이미 실행한 경우 중복 실행해도 안전 (값이 동일하면 변경 없음)
-- ─────────────────────────────────────────────────────────
UPDATE storage.buckets
SET public = false
WHERE name = 'frames';

-- ─────────────────────────────────────────────────────────
-- Step 2. 기존 정책 정리 (재실행 안전)
-- ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "frames_select_own" ON storage.objects;
DROP POLICY IF EXISTS "frames_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "frames_delete_own" ON storage.objects;

-- ─────────────────────────────────────────────────────────
-- Step 3. SELECT: 본인 폴더만 읽기 허용
--   storage.foldername(name)[1] = 경로의 첫 번째 폴더 (userId)
-- ─────────────────────────────────────────────────────────
CREATE POLICY "frames_select_own"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'frames'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────
-- Step 4. INSERT: 서버(service_role)만 업로드 — 클라이언트 직접 업로드 차단
--   service_role은 RLS bypass → 이 정책은 authenticated 역할에 적용
--   authenticated 사용자는 직접 업로드 불가 (API 서버를 통해서만 가능)
-- ─────────────────────────────────────────────────────────
-- (INSERT 정책 미생성 = authenticated 업로드 차단, service_role은 bypass)

-- ─────────────────────────────────────────────────────────
-- Step 5. DELETE: 본인 폴더만 삭제 허용 (향후 계정 탈퇴 시 사용)
-- ─────────────────────────────────────────────────────────
CREATE POLICY "frames_delete_own"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'frames'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ─────────────────────────────────────────────────────────
-- 검증 쿼리 (실행 후 아래 결과가 나와야 정상)
--
-- SELECT name, definition
-- FROM pg_policies
-- WHERE tablename = 'objects'
--   AND schemaname = 'storage';
--
-- 기대 결과: frames_select_own, frames_delete_own 정책 존재
-- ─────────────────────────────────────────────────────────
