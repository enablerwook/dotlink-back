# 현재 스프린트

_최종 업데이트: 2026-03-01_

---

## 현재 단계: Phase 9 — AI 분석 9차원 데이터 구조 재설계

### 완료된 Phase

| Phase | 설명 | 상태 |
|---|---|---|
| Phase 0 | 기반 구축 (Next.js, Tailwind, Supabase) | ✅ |
| Phase 1 | 인증 & 사용자 관리 (Email + Google OAuth) | ✅ |
| Phase 2 | DDD 구조 변환 (domains/, infrastructure/) | ✅ |
| Phase 3 | AI 분석 파이프라인 (Apify → Gemini → DB 저장) | ✅ |
| Phase 4 | 라이브러리 DB 연동 (CRUD API + UI) | ✅ |
| Phase 5 | 사용량 제한 (Phase 3/4에 내장) | ✅ |
| Phase 6 | 시냅스 & Creation Card | ✅ |
| Phase 7 | 결제 연동 | 🔲 (보류) |
| Phase 8 | 프레임 추출 (ffmpeg → Supabase Storage) | ✅ |

---

## Phase 9: AI 분석 9차원 데이터 구조 재설계

### 배경

기존 Gemini 분석 결과의 필드명(한국어, 임시 구조)을 영문 비즈니스 언어로 재정의하고,
각 항목의 데이터 출처(Apify / Whisper / Gemini)를 명확히 분리한다.
또한 OpenAI Whisper STT를 실제 파이프라인에 연결한다.

### 9개 분석 차원 및 데이터 출처

| 필드명 | 설명 | 데이터 출처 |
|---|---|---|
| `hook_analysis` | 후킹 영상 분석 (시각적 오프닝 전략) | Gemini |
| `hook_text` | 후킹 텍스트 분석 (첫 자막/대사 전략) | Gemini |
| `full_script` | 전체 대본 (음성 → 텍스트) | Whisper STT |
| `caption` | 원본 캡션 & 해시태그 | Apify |
| `production_note` | 촬영/편집 스타일 분석 | Gemini |
| `engagement` | 참여 지표 + 분석 (JSONB) | Apify(metrics) + Gemini(analysis) |
| `content_type` | 콘텐츠 유형 분류 | Gemini |
| `selling_point` | 판매/설득 포인트 분석 | Gemini |
| `difficulty` | 제작 난이도 (기획/촬영/편집) | Gemini |

### engagement JSONB 구조 (결정 완료)

```json
{
  "metrics": {
    "likes": 12000,
    "views": 340000,
    "comments": 450,
    "shares": 0
  },
  "analysis": "높은 조회수 대비 댓글이 적음. 정보 소비형 콘텐츠 특성. CTA 강화 필요."
}
```

### 진행 중인 작업

- [ ] Step 1: `openai` npm 패키지 설치
- [ ] Step 2: `lib/types.ts` — `AnalysisResult` 필드명 영문 재정의
- [ ] Step 3: `infrastructure/ai/prompts.ts` — Gemini 시스템 프롬프트 분리
- [ ] Step 4: `infrastructure/ai/whisper-client.ts` — Whisper STT 클라이언트 구현
- [ ] Step 5: `infrastructure/apify/apify-client.ts` — `commentCount`, `saveCount` 추가
- [ ] Step 6: `infrastructure/ai/gemini-client.ts` — 6개 함수로 리팩토링 + engagement 분석 추가
- [ ] Step 7: `domains/analysis/analysis-service.ts` — 파이프라인 재설계 (병렬 + 순차)
- [ ] Step 8: `app/api/library/route.ts` — scores 필드 매핑 업데이트
- [ ] Step 9: `components/analysis/analysis-results.tsx` — 새 필드명으로 UI 업데이트
- [ ] Step 10: DB 마이그레이션 — `public.analyses` scores JSONB 구조 문서화

---

## 필요 API 키

| 키 이름 | 용도 | 상태 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | ✅ 보유 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 클라이언트 키 | ✅ 보유 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 (서버 전용) | ✅ 보유 |
| `APIFY_API_TOKEN` | Apify 크롤링 서비스 | ✅ 보유 |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini 분석 | ✅ 보유 |
| `OPENAI_API_KEY` | OpenAI Whisper STT | 🔲 **신규 필요** |

---

## 블로커 / 미결정 사항

| 항목 | 상태 | 메모 |
|---|---|---|
| `OPENAI_API_KEY` | 🔲 미발급 | Whisper STT 구현 전 필요 |
| 결제 게이트웨이 | 🔲 미결정 | Phase 9 이후 진행 예정 |
| `shares` 지표 | ⚠️ 제한적 | Instagram API에서 공유 수 미제공 → 0으로 기본값 처리 |
