# 03. 라이브러리(Library) 도메인 매뉴얼

## 개요

분석 완료된 콘텐츠 카드를 저장, 조회, 필터링하는 도메인입니다.
사용자의 콘텐츠 DNA 컬렉션을 관리합니다.

---

## 파일 구조 (DDD 적용 후)

```
domains/library/
├── types.ts                        # LibraryCard, FilterOptions 타입
├── library-service.ts              # 저장/삭제/필터 비즈니스 로직
└── hooks/
    └── use-library.ts              # 라이브러리 상태 훅

infrastructure/supabase/
└── library-repository.ts           # CRUD DB 연산

app/
├── (dashboard)/library/page.tsx    # 라이브러리 페이지
└── api/library/
    ├── route.ts                    # GET (목록) / POST (저장)
    └── [id]/route.ts               # DELETE (삭제) / PATCH (수정)

components/library/
├── library-card.tsx                # 개별 카드 컴포넌트
├── library-grid.tsx                # 카드 그리드 레이아웃
└── library-filter.tsx              # 필터 UI (플랫폼, 날짜, 검색)
```

---

## DB 스키마 (library_cards)

```sql
CREATE TABLE public.library_cards (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  analysis_id  UUID NOT NULL REFERENCES public.analyses(id),
  title        TEXT NOT NULL,
  platform     TEXT CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  thumbnail    TEXT,
  url          TEXT NOT NULL,
  scores       JSONB,           -- DNA 9차원 점수
  note         TEXT,            -- 사용자 메모
  is_favorite  BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

자세한 스키마는 `.context/schema.md` 참조.

---

## API 설계

### GET /api/library
```typescript
// Query Params
{ platform?: string, search?: string, page?: number }

// Response
{
  cards: LibraryCard[]
  total: number
  hasMore: boolean
}
```

### POST /api/library
```typescript
// Request
{ analysisId: string, note?: string }

// Response
{ card: LibraryCard }
```

### DELETE /api/library/[id]
```typescript
// Response
{ success: boolean }
```

---

## 플랜별 제한

| 플랜 | 라이브러리 한도 |
|---|---|
| Starter | 최대 10개 |
| Creator | 무제한 |
| Pro | 무제한 |

- 저장 시 `domains/billing/`에서 플랜 제한 확인
- 한도 초과 시 업그레이드 유도 모달 표시

---

## 필터/정렬 옵션

- 플랫폼: `instagram` / `tiktok` / `youtube` / `all`
- 정렬: 최신순 / 오래된순 / 즐겨찾기
- 검색: 제목 키워드 검색

---

## 현재 상태

- UI: ✅ 완성 (Mock 데이터)
- DB 연동: 🔲 미구현
- 필터/검색: 🔲 미구현 (UI만 존재)
- 즐겨찾기: 🔲 미구현
