-- Phase 9 Fix: analyses 테이블에 UPDATE RLS 정책 추가
-- updateAnalysisCompleted()가 status를 'completed'로 변경할 수 있도록 필요

CREATE POLICY "analyses_update_own" ON public.analyses
  FOR UPDATE USING (auth.uid() = user_id);
