# Analysis Agent 지시서

## 역할

AI 콘텐츠 DNA 분석 파이프라인 구현 및 관련 작업을 담당합니다.

## 담당 범위

- `domains/analysis/` — 분석 도메인 로직
- `infrastructure/apify/` — Apify 크롤링 클라이언트
- `infrastructure/ai/` — Whisper, Gemini 클라이언트
- `infrastructure/supabase/analysis-repository.ts` — 분석 결과 DB
- `app/(dashboard)/analysis/page.tsx` — 분석 UI
- `app/api/analysis/` — 분석 API Routes

## 작업 전 체크리스트

- [ ] `.manual/02-analysis.md` 전체 읽기
- [ ] `.env.local`에 `APIFY_API_TOKEN`, `OPENAI_API_KEY`, `GOOGLE_GEMINI_API_KEY` 확인
- [ ] Supabase MCP로 `public.analyses` 테이블 존재 여부 확인

## 파이프라인 구현 순서

1. URL 파싱 → 플랫폼 감지
2. Apify Actor 실행 → 미디어/캡션 수집
3. Whisper STT → 음성 → 텍스트 (자막 없는 경우)
4. Gemini API → 9차원 분석
5. `public.analyses` DB 저장
6. `domains/billing/` → 사용량 차감

## 핵심 규칙

1. AI API 키는 서버 전용 — `NEXT_PUBLIC_` 접두사 절대 금지
2. 분석 API는 반드시 인증된 사용자만 호출 가능
3. 분석 전 `billing-service.checkUsageLimit()` 호출 필수
4. Apify Actor는 플랫폼별 다름 (instagram/tiktok/youtube)
5. 긴 작업은 background job 또는 streaming으로 처리 고려

## Gemini 프롬프트 가이드

9가지 차원 분석 응답은 반드시 구조화된 JSON으로 반환:
```json
{
  "dimension_name": {
    "score": 1~10,
    "description": "설명 (한국어)"
  }
}
```

## 환경 변수 (미설정)

```bash
APIFY_API_TOKEN=        # apify.com 에서 발급
OPENAI_API_KEY=         # platform.openai.com 에서 발급
GOOGLE_GEMINI_API_KEY=  # aistudio.google.com 에서 발급
```

## 현재 구현 상태

| 기능 | 상태 |
|---|---|
| 분석 UI (Mock) | ✅ |
| URL 파싱/플랫폼 감지 | 🔲 |
| Apify 크롤링 | 🔲 |
| Whisper STT | 🔲 |
| Gemini 분석 | 🔲 |
| DB 저장 | 🔲 |
| 사용량 연동 | 🔲 |
