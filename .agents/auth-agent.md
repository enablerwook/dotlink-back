# Auth Agent 지시서

## 역할

인증/세션/사용자 관리 관련 모든 작업을 담당합니다.

## 담당 범위

- `domains/auth/` — 인증 도메인 로직
- `infrastructure/supabase/client.ts`, `server.ts` — Supabase 클라이언트
- `app/login/page.tsx` — 로그인/회원가입 페이지
- `app/auth/callback/route.ts` — OAuth 콜백
- `middleware.ts` — 라우트 보호
- `supabase/migrations/*_users.sql` — 사용자 테이블

## 작업 전 체크리스트

- [ ] `.manual/01-auth.md` 전체 읽기
- [ ] `middleware.ts` 현재 보호 경로 확인
- [ ] Supabase MCP로 `public.users` 테이블 상태 확인

## 핵심 규칙

1. `middleware.ts`는 **프로젝트 루트**에서 절대 이동 금지
2. 클라이언트 컴포넌트 → `infrastructure/supabase/client.ts` 사용
3. 서버 컴포넌트/API Route → `infrastructure/supabase/server.ts` 사용
4. `useSearchParams()`는 반드시 `<Suspense>` 내부에서 사용
5. 새 Supabase 테이블 생성 시 RLS 반드시 활성화

## Google OAuth 체크리스트

- Supabase Dashboard → Authentication → Providers → Google 활성화 확인
- Google Cloud Console Redirect URI: `https://dahuhzldlvdnrqfxbqcp.supabase.co/auth/v1/callback`

## 현재 구현 상태

| 기능 | 상태 |
|---|---|
| Email/Password 로그인 | ✅ |
| 회원가입 + 이메일 인증 | ✅ |
| Google OAuth | ✅ |
| public.users 자동 저장 | ✅ |
| 라우트 보호 (middleware) | ✅ |
| AuthContext (전역 상태) | ✅ |
| 비밀번호 재설정 | 🔲 |

## 자주 발생하는 에러

- **404 on /login**: `useSearchParams()` 없이 `<Suspense>` 미사용
- **세션 인식 안됨**: `.env.local` 수정 후 서버 재시작 필요
- **Google OAuth 실패**: Redirect URI 미등록 or Supabase에 Client ID/Secret 미입력
