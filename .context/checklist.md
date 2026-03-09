# 구현 체크리스트

_최종 업데이트: 2026-03-01 (Phase 8 완료, Phase 9 진행 중)_

---

## Phase 0: 기반 구축 ✅

- [x] Next.js 프로젝트 셋업
- [x] Tailwind CSS v4 + shadcn/ui 설정
- [x] Supabase 프로젝트 생성 및 연결
- [x] npm 의존성 설치
- [x] 멀티에이전트 시스템 설치 (CLAUDE.md, .manual/, .agents/, .context/)

---

## Phase 1: 인증 & 사용자 관리 ✅

- [x] Email/Password 로그인/회원가입
- [x] Google OAuth 소셜 로그인
- [x] Suspense 래핑 (useSearchParams 오류 수정)
- [x] AuthContext 전역 상태
- [x] middleware.ts 라우트 보호
- [x] public.users 테이블 + RLS + 트리거
- [x] 사이드바 사용자 정보 + 로그아웃
- [ ] 비밀번호 재설정 이메일

---

## Phase 2: DDD 구조 변환 ✅

- [x] `domains/` 폴더 구조 생성
- [x] `infrastructure/supabase/` 이전 (lib/supabase/ → re-export 배럴)
- [x] `infrastructure/ai/` 생성 (디렉토리)
- [x] `infrastructure/apify/` 생성 (디렉토리)
- [x] `infrastructure/payment/` 생성 (디렉토리)
- [x] `components/shared/` 도메인별 재구성
- [x] import 경로 업데이트 (직접 DDD 경로 사용)
- [x] `middleware.ts` → `proxy.ts` (Next.js 16 호환)

---

## Phase 3: AI 분석 파이프라인 ✅

- [x] `public.analyses` 테이블 생성 (Supabase MCP)
- [x] Apify 클라이언트 구현 (`infrastructure/apify/apify-client.ts`)
- [ ] Whisper STT 클라이언트 구현 (향후 — API 키 필요)
- [x] Gemini 분석 클라이언트 구현 (`infrastructure/ai/gemini-client.ts`, 9차원 프롬프트)
- [x] `POST /api/analysis` Route Handler
- [x] 분석 결과 → `public.analyses` 저장 + 사용량 차감
- [x] 분석 UI → 실제 API 연결 (Mock 제거)
- [x] 로딩 상태 / 에러 처리 / 사용량 한도 초과 안내

---

## Phase 4: 라이브러리 DB 연동 ✅

- [x] `public.library_cards` 테이블 생성 (Supabase MCP)
- [x] `GET /api/library` — 목록 조회
- [x] `POST /api/library` — 저장 (플랜 한도 체크 포함)
- [x] `PATCH /api/library/[id]` — 메모, 즐겨찾기 수정
- [x] `DELETE /api/library/[id]` — 삭제
- [x] 라이브러리 UI → 실제 API 연결 (Mock 제거)
- [x] 시냅스 UI → `useLibraryCards()` 훅으로 실제 데이터 사용
- [x] AppContext → selectedCardA 전용으로 정리 (mock 의존성 제거)

---

## Phase 5: 사용량 제한 ✅ (Phase 3/4에 내장됨)

- [x] `public.usage_records` 테이블 생성 (Supabase MCP)
- [x] `increment_analysis_count()` RPC 함수 (원자적 증가)
- [x] 분석 API에 사용량 체크 적용 (`getMonthlyUsage` + 플랜 한도 비교)
- [x] 라이브러리 저장 시 한도 체크 적용 (Starter 10개)
- [ ] 한도 초과 시 업그레이드 유도 모달 (향후)

---

## Phase 5 추가: 사용량 제한 (미완)

- [ ] `public.usage_records` 테이블 생성
- [ ] `billing-service.checkUsageLimit()` 구현
- [ ] `billing-service.checkLibraryLimit()` 구현
- [ ] 분석 API에 사용량 체크 미들웨어 적용
- [ ] 라이브러리 저장 시 한도 체크 적용
- [ ] 한도 초과 시 업그레이드 유도 모달

---

## Phase 6: 시냅스 & Creation Card ✅

- [x] `public.creation_cards` 테이블 생성 (Supabase MCP)
- [x] `POST /api/synapse/compare` — AI 비교 분석 (Gemini 2.0 Flash)
- [x] `POST /api/synapse` — Creation Card 저장
- [x] `GET /api/synapse` — Creation Card 목록 조회
- [x] 시냅스 UI → 실제 API 연결 (AI 비교 분석 버튼 + 자동 필드 채우기 + 저장/내보내기)

---

## Phase 7: 결제 연동 🔲

- [ ] 결제 게이트웨이 선택
- [ ] `public.subscriptions` 테이블 생성
- [ ] 결제 플로우 구현
- [ ] 웹훅 처리 (`/api/billing/webhook`)
- [ ] 구독 상태 동기화 (users.plan 업데이트)
- [ ] 결제 페이지 UI

---

## Phase 8: 프레임 추출 (실제 영상 → 이미지) ✅

- [x] Supabase Storage `frames` 버킷 생성 (public)
- [x] `fluent-ffmpeg`, `ffmpeg-static`, `@types/fluent-ffmpeg` 의존성 추가
- [x] `FrameData` 타입에 `imageUrl?: string`, `timestamp?: number` 추가 (`lib/types.ts`)
- [x] `ApifyResult`에 `videoUrl?: string` 추가 및 매핑 (`infrastructure/apify/apify-client.ts`)
- [x] `infrastructure/video/frame-extractor.ts` 구현 (다운로드 → ffmpeg 추출 → Storage 업로드)
- [x] `analysis-service.ts` 파이프라인에 프레임 추출 연결 (videoUrl 있으면 실제 프레임)
- [x] `FrameCarousel` 실제 이미지 표시 + `aspect-[9/12]` 변경 (`components/analysis/frame-carousel.tsx`)

---

---

## Phase 9: AI 분석 9차원 데이터 구조 재설계 ✅

### Step 1: 의존성 설치
- [x] `openai` npm 패키지 설치

### Step 2: 타입 재정의
- [x] `lib/types.ts` — `AnalysisResult` 필드명 영문 확정
  - `hook_analysis: string` — 후킹 영상 분석 (Gemini)
  - `hook_text: string` — 첫 5초 발화 텍스트 **(Whisper STT, verbose_json segments)**
  - `full_script: string` — 전체 대본 (Whisper STT)
  - `caption: string` — 원본 캡션 (Apify)
  - `production_note: string` — 촬영/편집 분석 (Gemini)
  - `engagement: { metrics: EngagementMetrics; analysis: string }` — 지표(Apify) + 분석(Gemini)
  - `content_type: string` — 콘텐츠 유형 (Gemini)
  - `selling_point: string` — 소구점 분석 (Gemini)
  - `difficulty: { planning: number; filming: number; editing: number }` — 난이도 (Gemini)
- [x] `EngagementMetrics`, `EngagementData` 인터페이스 추가
- [x] `domains/analysis/types.ts` — lib/types.ts re-export로 단순화

### Step 3: 시스템 프롬프트 분리
- [x] `infrastructure/ai/prompts.ts` 생성 (Gemini 6개 차원별 프롬프트 빌더 함수)
- [x] `buildHookPrompt()` — `hook_text` 제거 (Whisper에서 직접 추출)

### Step 4: Whisper 클라이언트 구현
- [x] `infrastructure/ai/whisper-client.ts` 생성
  - `transcribeAudio(videoUrl, analysisId): Promise<{ full_script, hook_text }>` 함수
  - `response_format: "verbose_json"` + `timestamp_granularities: ["segment"]`
  - `hook_text` = segments.filter(s => s.start < 5.0) (첫 5초 발화)
  - 실패 시 `{ full_script: "", hook_text: "" }` 반환 (파이프라인 중단 없음)

### Step 5: Apify 클라이언트 보강
- [x] `infrastructure/apify/apify-client.ts` — `commentCount`, `saveCount` 필드 추가
- [x] `mapInstagramResult()` — `saveCount: 0` 기본값 처리

### Step 6: Gemini 클라이언트 리팩토링
- [x] `infrastructure/ai/gemini-client.ts` — 6개 함수로 분리
  - `analyzeHook(script, caption): Promise<{ hook_analysis }>` (**hook_text 제거**)
  - `analyzeProduction(script, caption): Promise<string>` → `production_note`
  - `analyzeContentType(script, caption): Promise<string>` → `content_type`
  - `analyzeSellingPoint(script, caption): Promise<string>` → `selling_point`
  - `analyzeDifficulty(script, caption): Promise<DifficultyRating>` → `difficulty`
  - `analyzeEngagement(metrics, script, hook, prod): Promise<string>` → `engagement.analysis`
- [x] `parseJson()` 3단계 fallback (직접 파싱 → 개행 정규화 → 잘린 JSON 복원 → `{}`)

### Step 7: 분석 서비스 파이프라인 재설계
- [x] `domains/analysis/analysis-service.ts` — 파이프라인 재설계
  - Whisper STT → `{ full_script, hook_text }` 동시 반환
  - 병렬 실행: `hook_analysis`, `production_note`, `content_type`, `selling_point`, `difficulty`
  - 순차 실행: `engagement.analysis` (hook_analysis + production_note 결과 활용)
  - `caption`: Apify `description` 직접 사용
  - frame 0 항상 Apify `thumbnailUrl` 사용 (ffmpeg 0.0s 추출 신뢰성 낮음)

### Step 8: DB 마이그레이션 (적용 완료)
- [x] `supabase/migrations/20260301000001_analyses_update_policy.sql` — UPDATE RLS 정책 추가
- [x] `supabase/migrations/20260301000002_db_schema_v2.sql`
  - `analyses.transcript` → `full_script` 컬럼 rename
  - `analyses.frames JSONB` 컬럼 추가
  - `library_cards.frames JSONB` 컬럼 추가
- [x] `app/api/library/route.ts` — `frames` JSONB 읽기/쓰기 연결

### Step 9: UI 업데이트
- [x] `components/analysis/analysis-results.tsx` — 새 필드명으로 렌더링 (분석 탭)
- [x] `components/library/card-detail-modal.tsx` — Phase 9 필드명으로 전면 교체 (라이브러리 모달)
  - 텍스트 7개 섹션: `hook_analysis`, `hook_text`, `full_script`, `caption`, `production_note`, `content_type`, `selling_point`
  - 인게이지먼트 섹션: metrics 지표 그리드 + analysis 정성 분석
  - 난이도 섹션: `DifficultyMeter`
- [x] `components/library/content-card.tsx` — `imageUrl` 있을 때 실제 이미지 렌더링

---

## Phase 9 이후: 미수정 항목 (기술 부채)

### 🔴 즉시 — 사용자 화면에 영향
- [ ] **기존 저장된 library_cards 재분석/재저장** — Phase 9 이전 저장 카드는 구 scores 구조 보유 → 라이브러리 모달에서 빈 데이터 표시됨. 해당 URL 재분석 후 삭제 후 재저장 필요.

### 🟡 코드 수정 — 데이터 불일치
- [x] **`POST /api/library` — `thumbnail` 누락** (`app/api/library/route.ts`)
  - `INSERT` 시 `thumbnail: analysis.thumbnail ?? null` 추가 완료

### 🟢 DB 기술 부채 — 낮은 우선순위
- [x] **`analyses.full_script` / `caption` 전용 컬럼 중복 제거** — `updateAnalysisCompleted()`에서 `full_script:`, `caption:` 전용 컬럼 저장 코드 제거. `scores` JSONB로만 저장하도록 통일.
- [x] **`library_cards.thumbnail` 컬럼 미활용** — `POST /api/library` INSERT 시 `thumbnail: analysis.thumbnail` 추가 완료.
- [x] **`frame-carousel.tsx` Next.js Image → img 교체** — 메인 뷰어 및 썸네일 스트립 모두 `<img>` 태그로 변경. 외부 CDN URL 렌더링 안정성 확보.

---

---

## Phase 10: 시냅스 페이지 전면 재설계 🔲

_최종 업데이트: 2026-03-06_

### Step 1: DB 마이그레이션 — creation_cards 스키마 교체
- [x] `supabase/migrations/20260306000001_creation_cards_v2.sql` 작성
  - 기존 컬럼 제거: `hooking_point`, `content_structure`, `differentiation`, `keywords`, `ai_insights`, `draft`
  - 신규 컬럼 추가: `title TEXT`, `steps JSONB DEFAULT '{}'`, `updated_at TIMESTAMPTZ DEFAULT now()`
  - `source_card_a_id`, `source_card_b_id` ON DELETE SET NULL 유지
  - RLS 정책: SELECT/INSERT/UPDATE/DELETE 모두 `user_id = auth.uid()`
- [x] Supabase Dashboard에서 마이그레이션 실행

### Step 2: 타입 업데이트 — `domains/synapse/types.ts`
- [ ] `CreationSteps` 인터페이스 추가 (9개 필드: `draft_script`, `content_type`, `hook_text`, `hook_visual`, `engagement`, `caption`, `selling_point`, `production`, `final_script`)
- [ ] `CreationCard` 타입 교체 (구 필드 → `title`, `steps: CreationSteps`, `sourceCardAId`, `sourceCardBId`)
- [ ] `DroppedFrame`, `CreationSaveData` 유지 (로컬 임시저장용)

### Step 3: API 업데이트 — `app/api/synapse/route.ts`
- [ ] `GET /api/synapse` — `creation_cards` 전체 조회, `CreationCard[]` 반환
- [ ] `POST /api/synapse` — `title` + `steps` + `sourceCardAId/B` 받아서 INSERT
- [ ] 인증 확인 (user_id = auth.uid())
- [ ] Fail Fast + Named Error 적용

### Step 4: 시냅스 페이지 재설계 — `app/(dashboard)/synapse/page.tsx`
- [ ] `selectedCardA` (AppContext) 의존성 제거
- [ ] 로컬 상태 추가: `cardA: ContentCard | null`, `cardB: ContentCard | null`
- [ ] `pickerOpen: "A" | "B" | null` 상태로 팝업 제어
- [ ] Card A 슬롯: `cardA === null` → `EmptyCardSlot`, 아니면 `ComparisonCard`
- [ ] Card B 슬롯: `cardB === null` → `EmptyCardSlot`, 아니면 `ComparisonCard`
- [ ] `useLibraryCards()` 훅으로 라이브러리 카드 목록 로드 → `LibraryPickerDialog`에 전달
- [ ] AI 비교 분석 버튼: `cardA && cardB` 둘 다 선택됐을 때만 활성화

### Step 5: LibraryPickerDialog 연결 (Phase A에서 완료된 컴포넌트 활용)
- [ ] 시냅스 페이지에서 `LibraryPickerDialog` import
- [ ] `slotLabel="Card A"` / `slotLabel="Card B"` + `excludeCardId` 적용
- [ ] 선택 콜백: `onSelect={(card) => setCardA(card)}` / `setCardB(card)`

### Step 6: CardStack 컴포넌트 필드명 수정 — `components/synapse/card-stack.tsx`
- [ ] `sections` 배열 하드코딩 제거
- [ ] `ANALYSIS_CARD_SECTIONS` SSOT 사용 (`@/lib/analysis-tabs`)
- [ ] `current.analysis[key]` 접근 유지 (ContentCard.analysis 구조 동일)

### Step 7: Creation Card 전면 교체 — `components/synapse/creation-card.tsx`
- [ ] 9개 필드 교체: 기존 (`script`, `hookVisual`, `storyboard` 등) → 확정 필드명 (`draft_script`, `hook_text`, `hook_visual`, `engagement`, `content_type`, `caption`, `selling_point`, `production`, `final_script`)
- [ ] 상단 버튼 3개 구현:
  - `저장하기` → 제목 입력 Dialog → `POST /api/synapse` 호출
  - `불러오기` → `CreationPickerDialog` 열기
  - `내보내기` → 텍스트 파일 다운로드 (기존 로직 유지)
- [ ] 저장 성공 시 토스트 or 체크 표시
- [ ] 0/9 진행률 Badge (채워진 단계 수 카운트)

### Step 8: CreationPickerDialog 신규 생성 — `components/synapse/creation-picker-dialog.tsx`
- [ ] `LibraryPickerDialog`와 동일한 UI 구조 (Dialog + 검색 + 그리드)
- [ ] 데이터: `GET /api/synapse` 호출 → `CreationCard[]`
- [ ] 카드 선택 시 `steps` 9개 필드를 Creation Card 폼에 로드
- [ ] 단일 책임: "저장된 기획안 선택" 기능만

### Step 9: 라이브러리 "크리에이션 카드" 탭 연결
- [ ] `app/(dashboard)/library/page.tsx` — 탭 추가 또는 기존 탭 연결 확인
- [ ] `GET /api/synapse` 데이터로 크리에이션 카드 목록 렌더링
- [ ] 카드 클릭 시 `CreationDetailModal` 열기 (Phase A에서 완료된 컴포넌트 활용)

### Step 10: 타입 검사 & 통합 테스트
- [ ] `npx tsc --noEmit` 0 errors 확인
- [ ] Card A/B 선택 → 카드 표시 동작 확인
- [ ] Creation Card 저장 → 라이브러리 탭에 표시 확인
- [ ] 불러오기 → 9단계 내용 복원 확인

---

## 미결정 사항

- [ ] 결제 게이트웨이 선택 (Phase 7, 보류)
- [x] Whisper vs Apify 자막 우선순위 → **Whisper 우선 결정** (ADR-007)
- [x] hook_text 출처 → **Whisper STT verbose_json segments (start < 5.0s)** 결정
