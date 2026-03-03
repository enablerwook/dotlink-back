# 04. 시냅스(Synapse) 도메인 매뉴얼

## 개요

라이브러리의 두 콘텐츠 카드를 선택해 비교 분석하고, 그 조합으로 새 대본의 씨앗인 **Creation Card**를 작성하는 도메인입니다.

> "좋은 예술가는 베끼고, 위대한 예술가는 훔친다"
> 두 콘텐츠의 DNA를 교차해 나만의 창작물로 재탄생시키세요.

---

## 파일 구조 (DDD 적용 후)

```
domains/synapse/
├── types.ts                           # SynapseSession, CreationCard 타입
├── synapse-service.ts                 # 비교 분석 + Creation Card 생성 로직
└── hooks/
    └── use-synapse.ts                 # 시냅스 상태 훅

infrastructure/supabase/
└── synapse-repository.ts              # Creation Card CRUD

app/
├── (dashboard)/synapse/page.tsx       # 시냅스 페이지
└── api/synapse/
    ├── route.ts                       # POST — Creation Card 저장
    └── compare/route.ts               # POST — 두 카드 AI 비교 분석

components/synapse/
├── card-selector.tsx                  # 라이브러리에서 카드 2개 선택
├── dna-comparison.tsx                 # 나란히 비교 UI
├── creation-card-form.tsx             # Creation Card 작성 폼
└── creation-card-result.tsx           # 완성된 Creation Card 표시
```

---

## 사용자 플로우

```
1. 라이브러리에서 콘텐츠 A 선택
2. 라이브러리에서 콘텐츠 B 선택
3. AI가 두 콘텐츠의 DNA 9차원 비교 분석 표시
4. 사용자가 Creation Card 작성:
   - 참고한 후킹 포인트
   - 가져갈 구조
   - 나만의 차별화 요소
   - 타깃 키워드/해시태그
5. Creation Card 저장 → 대본 작성 시작 (향후 기능)
```

---

## Creation Card 구조

```typescript
interface CreationCard {
  id: string
  userId: string
  sourceCardAId: string     // 참고 콘텐츠 A
  sourceCardBId: string     // 참고 콘텐츠 B
  hookingPoint: string      // 참고한 후킹 포인트
  contentStructure: string  // 가져갈 구조
  differentiation: string   // 나만의 차별화
  keywords: string[]        // 타깃 키워드/해시태그
  aiInsights?: string       // AI 비교 분석 결과
  draft?: string            // 완성된 대본 (향후)
  createdAt: string
}
```

---

## API 설계

### POST /api/synapse/compare
```typescript
// Request
{ cardAId: string, cardBId: string }

// Response
{
  comparison: {
    similarities: string[]
    differences: string[]
    combinationInsights: string[]
  }
}
```

### POST /api/synapse
```typescript
// Request: CreationCard 데이터
// Response: { card: CreationCard }
```

---

## DB 스키마 (creation_cards)

```sql
CREATE TABLE public.creation_cards (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_card_a_id UUID REFERENCES public.library_cards(id),
  source_card_b_id UUID REFERENCES public.library_cards(id),
  hooking_point    TEXT,
  content_structure TEXT,
  differentiation  TEXT,
  keywords         TEXT[],
  ai_insights      TEXT,
  draft            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

---

## 현재 상태

- UI: ✅ 완성 (Mock 데이터)
- AI 비교 분석: 🔲 미구현
- Creation Card DB 저장: 🔲 미구현
- 대본 완성 & 내보내기: 🔲 미구현 (향후 기능)
