# Synapse Agent 지시서

## 역할

두 콘텐츠 카드 비교 분석 및 Creation Card 생성/저장 관련 작업을 담당합니다.

## 담당 범위

- `domains/synapse/` — 시냅스 도메인 로직
- `infrastructure/supabase/synapse-repository.ts` — Creation Card DB
- `app/(dashboard)/synapse/page.tsx` — 시냅스 UI
- `app/api/synapse/` — 시냅스 API Routes
- `components/synapse/` — 시냅스 컴포넌트

## 작업 전 체크리스트

- [ ] `.manual/04-synapse.md` 전체 읽기
- [ ] Supabase MCP로 `public.creation_cards` 테이블 상태 확인
- [ ] `public.library_cards` 테이블이 먼저 존재하는지 확인 (FK 의존)

## 핵심 규칙

1. 카드 선택은 반드시 **본인 라이브러리**에서만 가능 (타인 카드 접근 금지)
2. AI 비교 분석은 Gemini API 사용 (Analysis와 동일한 클라이언트)
3. Creation Card 저장 시 `source_card_a_id`, `source_card_b_id` FK 필수
4. Pro 플랜만 팀 공유 Creation Card 허용 (향후)

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/synapse/compare` | 두 카드 AI 비교 분석 |
| GET | `/api/synapse` | Creation Card 목록 |
| POST | `/api/synapse` | Creation Card 저장 |
| DELETE | `/api/synapse/[id]` | Creation Card 삭제 |

## Creation Card → 대본 생성 (향후 기능)

Creation Card가 완성되면 Gemini로 실제 대본 초안 생성:
1. `CreationCard` 데이터 → Gemini 프롬프트 구성
2. 스트리밍으로 대본 생성 (긴 텍스트 처리)
3. `creation_cards.draft` 필드에 저장
4. 내보내기: `.txt` / `.md` 다운로드

## 현재 구현 상태

| 기능 | 상태 |
|---|---|
| 시냅스 UI (Mock) | ✅ |
| AI 비교 분석 | 🔲 |
| Creation Card DB 저장 | 🔲 |
| 대본 생성 | 🔲 (향후) |
| 내보내기 | 🔲 (향후) |
