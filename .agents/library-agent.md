# Library Agent 지시서

## 역할

라이브러리 카드 CRUD, 필터/검색, 즐겨찾기 관련 작업을 담당합니다.

## 담당 범위

- `domains/library/` — 라이브러리 도메인 로직
- `infrastructure/supabase/library-repository.ts` — DB CRUD
- `app/(dashboard)/library/page.tsx` — 라이브러리 UI
- `app/api/library/` — 라이브러리 API Routes
- `components/library/` — 라이브러리 컴포넌트

## 작업 전 체크리스트

- [ ] `.manual/03-library.md` 전체 읽기
- [ ] Supabase MCP로 `public.library_cards` 테이블 상태 확인
- [ ] `public.analyses` 테이블이 먼저 존재하는지 확인 (FK 의존)

## 핵심 규칙

1. `library_cards.user_id`로 RLS 적용 (본인 카드만 조회/수정/삭제)
2. 저장 전 `billing-service.checkLibraryLimit()` 호출 (Starter: 10개 한도)
3. 분석 결과를 라이브러리에 저장할 때 `analyses.id` FK 유지
4. 삭제 시 `creation_cards`에서 참조 중인 카드는 soft delete 고려

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/library` | 카드 목록 조회 (필터/페이징) |
| POST | `/api/library` | 분석 결과 저장 |
| PATCH | `/api/library/[id]` | 메모/즐겨찾기 수정 |
| DELETE | `/api/library/[id]` | 카드 삭제 |

## 현재 구현 상태

| 기능 | 상태 |
|---|---|
| 라이브러리 UI (Mock) | ✅ |
| DB 연동 | 🔲 |
| 필터/검색 | 🔲 |
| 즐겨찾기 | 🔲 |
| 무한 스크롤/페이징 | 🔲 |
