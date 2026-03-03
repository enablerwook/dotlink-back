# 01. 인증(Auth) 도메인 매뉴얼

## 개요

Supabase Auth를 사용한 Email/Password + Google OAuth 기반 인증 시스템.
모든 인증 상태는 `AuthContext`를 통해 전역 관리됩니다.

---

## 파일 구조 (DDD 적용 후)

```
domains/auth/
├── types.ts               # User, Session 타입 정의
├── auth-context.tsx        # 전역 AuthContext + useAuth 훅
└── hooks/
    └── use-auth-guard.ts   # 보호 라우트 훅 (선택)

infrastructure/supabase/
├── client.ts              # 브라우저 클라이언트
└── server.ts              # 서버 클라이언트 (RSC/API Route)

app/
├── login/page.tsx          # 로그인/회원가입 페이지
└── auth/callback/route.ts  # Google OAuth 콜백 핸들러

middleware.ts               # 라우트 보호 (프로젝트 루트 고정)
```

---

## 핵심 패턴

### 클라이언트 vs 서버 클라이언트 구분

| 환경 | 파일 | 함수 |
|---|---|---|
| 클라이언트 컴포넌트 (`"use client"`) | `infrastructure/supabase/client.ts` | `createClient()` |
| 서버 컴포넌트 / API Route / Server Action | `infrastructure/supabase/server.ts` | `createClient()` |
| 미들웨어 | `@supabase/ssr` 직접 사용 | `createServerClient()` |

> ⚠️ 클라이언트 컴포넌트에서 `server.ts`를 import 하면 빌드 에러 발생

### AuthContext 구조

```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<void>
}
```

- `onAuthStateChange` 리스너로 실시간 상태 감지
- 앱 최상위 `AuthProvider`로 감싸야 함

---

## 인증 플로우

### Email/Password 로그인
```
사용자 입력 → supabase.auth.signInWithPassword() → 세션 쿠키 설정 → /analysis 리다이렉트
```

### Google OAuth 로그인
```
버튼 클릭 → supabase.auth.signInWithOAuth({ provider: 'google' })
→ Google 로그인 페이지
→ /auth/callback?code=xxx&next=/analysis
→ exchangeCodeForSession(code)
→ 세션 쿠키 설정
→ next 경로로 리다이렉트
```

### 회원가입
```
폼 제출 → supabase.auth.signUp() → 확인 이메일 발송
→ 이메일 링크 클릭 → /auth/callback → 세션 설정
→ handle_new_user 트리거 → public.users 자동 삽입
```

---

## Google OAuth 설정 체크리스트

1. Supabase 대시보드 → Authentication → Providers → Google 활성화
2. Google Cloud Console → OAuth 2.0 클라이언트 → 승인된 리디렉션 URI 추가:
   ```
   https://[PROJECT_REF].supabase.co/auth/v1/callback
   ```
3. Client ID / Client Secret → Supabase에 입력

---

## 미들웨어 보호 경로

```typescript
const PROTECTED_PATHS = ["/analysis", "/library", "/synapse", "/feature-request"]
```

- 미인증 → `/login?next={pathname}` 리다이렉트
- 인증 후 `/login` 접근 → `/analysis` 리다이렉트
- `getUser()` 호출로 쿠키 토큰 자동 갱신

---

## DB 연동

신규 가입 시 `public.users` 자동 삽입 (트리거):
```sql
handle_new_user() TRIGGER on auth.users INSERT
→ public.users (id, email, full_name, avatar_url, plan='starter')
```

자세한 스키마는 `.manual/06-database.md` 참조.

---

## 주의사항

- `useSearchParams()`는 반드시 `<Suspense>` 내부에서 사용 (Next.js App Router 규격)
- `.env.local` 수정 후 반드시 개발 서버 재시작
- `NEXT_PUBLIC_` 접두사로 서버 전용 키 노출 금지
