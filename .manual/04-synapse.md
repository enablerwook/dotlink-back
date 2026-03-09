# 04. 시냅스(Synapse) 도메인 매뉴얼

> 최종 업데이트: 2026-03-06 (Phase 10 설계 확정)

---

## 비개발자를 위한 전체 설명

### 시냅스 페이지가 하는 일

시냅스는 **"두 개의 잘 만들어진 콘텐츠를 참고해서, 나만의 새 콘텐츠 기획안(Creation Card)을 만드는 작업실"** 입니다.

```
[Card A 슬롯]  +  [Card B 슬롯]  →  [Creation Card: 내가 쓰는 기획안]
 (참고 영상 1)     (참고 영상 2)       (9단계 작성 공간)
```

화면은 3열로 나뉩니다:
- **왼쪽 (Card A)**: 내가 참고하고 싶은 첫 번째 콘텐츠
- **가운데 (Card B)**: 내가 참고하고 싶은 두 번째 콘텐츠
- **오른쪽 (Creation Card)**: 두 콘텐츠를 참고해서 내가 직접 작성하는 기획안 9단계

---

### 기능 1: Card A / Card B 슬롯 선택

**카드가 없을 때**:
- "카드를 선택해주세요 + 라이브러리에서 선택" 버튼이 보임 (빈 슬롯 UI)

**클릭하면**:
- 팝업창이 열리고, 라이브러리에 저장된 분석 카드 목록이 그리드 형태로 표시됨
- 검색창으로 제목/플랫폼 필터 가능
- 카드를 클릭하면 팝업이 닫히고 해당 슬롯에 카드가 표시됨

**중요한 설계 결정**:
- 선택 행위 자체는 DB에 기록하지 않음 (새로고침하면 초기화됨 — 의도적)
- 단, Creation Card를 저장할 때 "어떤 카드를 참고했는지" ID를 함께 저장함
  → 나중에 기획안을 다시 열었을 때 맥락을 알 수 있음

---

### 기능 2: Creation Card — 9단계 기획안 작성

사용자가 직접 손으로 채우는 9칸짜리 기획서입니다.

| 단계 | 이름 | 설명 |
|---|---|---|
| 1 | 스크립트 작성 (초안) | 아이디어 단계의 대본 초안 |
| 2 | 콘텐츠 유형 정의 | 브이로그? 튜토리얼? 리뷰? 형식 정하기 |
| 3 | 후킹 매력 요소 (대사) | 첫 3초에 시청자를 사로잡는 말 |
| 4 | 후킹 매력 요소 (영상) | 첫 3초에 시청자를 사로잡는 장면 |
| 5 | 인게이지먼트 유도 장치 | 댓글/공유/저장을 유도하는 장치 |
| 6 | 캡션 작성 | 업로드할 때 쓸 캡션 & 해시태그 |
| 7 | 세일즈 포인트 | 이 영상의 핵심 소구점/팔리는 이유 |
| 8 | 연출요소 | BGM, 자막, 전환효과 등 연출 계획 |
| 9 | 스크립트 (최종안) | 완성된 최종 대본 |

---

### 기능 3: Creation Card 상단 버튼 3개

```
[저장하기]  [불러오기]  [내보내기]
```

**저장하기**:
- 클릭 → 제목 입력 팝업 → 확인 → DB에 저장
- 저장된 기획안은 라이브러리 "크리에이션 카드" 탭에서 확인 가능

**불러오기**:
- 클릭 → 팝업창에 이전에 저장한 기획안 목록 표시
- 선택 → 해당 기획안의 9단계 내용이 현재 작성 공간에 불러와짐
- 이어서 수정 가능

**내보내기**:
- 9단계 내용을 텍스트 파일(.txt)로 다운로드

---

### 기능 4: 라이브러리 "크리에이션 카드" 탭

라이브러리 메뉴에는 탭이 두 개 있습니다:

| 탭 | 데이터 출처 | 누가 만드나 |
|---|---|---|
| 분석 카드 | `library_cards` 테이블 | AI가 자동으로 분석해서 저장 |
| 크리에이션 카드 | `creation_cards` 테이블 | 사용자가 직접 작성해서 저장 |

---

## 데이터 구조 (DB 스키마)

### creation_cards 테이블 (확정 설계)

```
id                → 기획안 고유 번호 (자동 생성)
user_id           → 작성한 사용자
source_card_a_id  → 참고한 카드 A의 ID (라이브러리 카드 연결)
source_card_b_id  → 참고한 카드 B의 ID (라이브러리 카드 연결)
title             → 기획안 제목 (저장 시 사용자가 입력)
steps             → 9단계 내용 묶음 (아래 참고)
created_at        → 저장 일시
updated_at        → 마지막 수정 일시
```

### steps 내부 구조 (9단계 필드명 확정)

```json
{
  "draft_script":  "스크립트 초안",
  "content_type":  "콘텐츠 유형",
  "hook_text":     "후킹 대사",
  "hook_visual":   "후킹 영상 요소",
  "engagement":    "인게이지먼트 유도 장치",
  "caption":       "캡션",
  "selling_point": "세일즈 포인트",
  "production":    "연출요소",
  "final_script":  "최종 스크립트"
}
```

**왜 분석 카드 필드명과 비슷한데 괜찮나?**
- 분석 카드: `library_cards.analysis.hook_text` (AI가 추출한 실제 후킹 텍스트)
- 크리에이션 카드: `creation_cards.steps.hook_text` (내가 직접 쓴 후킹 대사)
- 항상 `steps.` 접두어로 접근하므로 코드에서 절대 혼동 없음

---

## 파일 구조 (DDD 기준)

```
domains/synapse/
├── types.ts                     ← CreationCard 타입, CreationSteps 타입
└── app-context.tsx              ← (현재) selectedCardA 전역 상태

infrastructure/supabase/
└── (synapse-repository.ts)      ← Creation Card CRUD (신규 생성 예정)

app/
├── (dashboard)/synapse/page.tsx ← 시냅스 페이지
└── api/synapse/
    ├── route.ts                 ← GET(목록), POST(저장)
    └── compare/route.ts         ← POST — AI 비교 분석

components/synapse/
├── comparison-card.tsx          ← 선택된 카드 분석 내용 표시 (Card A/B)
├── card-stack.tsx               ← Card B 카드 표시 (개선 필요)
├── creation-card.tsx            ← 9단계 입력 폼 + 저장/불러오기/내보내기
├── empty-card-slot.tsx          ← 카드 미선택 상태 UI ✅ (Phase A 완료)
├── library-picker-dialog.tsx    ← 분석 카드 선택 팝업 ✅ (Phase A 완료)
└── creation-picker-dialog.tsx   ← 크리에이션 카드 불러오기 팝업 (신규)
```

---

## 팝업 두 종류 비교

| 팝업 | 트리거 | 보여주는 데이터 | 재사용 컴포넌트 |
|---|---|---|---|
| 카드 선택 팝업 (A/B) | Card A 또는 B 슬롯 클릭 | 라이브러리 분석 카드 | `LibraryPickerDialog` |
| 불러오기 팝업 | Creation Card "불러오기" 버튼 | 내가 저장한 기획안 | `CreationPickerDialog` (신규) |

두 팝업은 동일한 UI 구조를 사용하되, 데이터 출처만 다릅니다.

---

## API 설계

### GET /api/synapse
- 내 크리에이션 카드 목록 반환
- 라이브러리 "크리에이션 카드" 탭 및 "불러오기" 팝업에서 사용

### POST /api/synapse
```
요청: {
  title: "기획안 제목",
  sourceCardAId: "참고 카드 A ID",
  sourceCardBId: "참고 카드 B ID",
  steps: { draft_script, content_type, hook_text, ... }
}
응답: { id: "저장된 기획안 ID" }
```

### POST /api/synapse/compare (기존 유지)
```
요청: { cardAId, cardBId }
응답: { result: CompareResult }
```

---

## 현재 상태 vs 목표 상태

| 항목 | 현재 | 목표 (Phase 10) |
|---|---|---|
| Card A 선택 | AppContext에서 전역 selectedCardA 사용 | 시냅스 페이지 로컬 상태 |
| Card B 선택 | CardStack으로 라이브러리 순환 | 팝업으로 직접 선택 |
| 빈 슬롯 UI | 없음 (바로 ComparisonCard 표시) | EmptyCardSlot 표시 |
| Creation Card 저장 | 기존 필드 구조 (hooking_point 등) | steps JSONB 신규 스키마 |
| 불러오기 기능 | 없음 | CreationPickerDialog |
| 라이브러리 크리에이션 탭 | 없음 | GET /api/synapse 연결 |
