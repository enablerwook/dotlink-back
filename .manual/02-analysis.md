# 02. AI 분석(Analysis) 도메인 매뉴얼

## 개요

숏폼 URL(인스타그램/틱톡/유튜브)을 입력받아 AI가 9가지 차원으로 콘텐츠 DNA를 분석합니다.

**파이프라인**: Apify (크롤링) → Whisper (음성→텍스트) → Gemini (분석)

---

## 파일 구조 (DDD 적용 후)

```
domains/analysis/
├── types.ts                      # AnalysisResult, DnaScore 등 타입
├── analysis-service.ts           # 분석 비즈니스 로직
└── hooks/
    └── use-analysis.ts           # 분석 상태 훅

infrastructure/
├── apify/
│   └── apify-client.ts           # Apify 크롤링 클라이언트
├── ai/
│   ├── whisper-client.ts         # OpenAI Whisper 클라이언트
│   └── gemini-client.ts          # Google Gemini 클라이언트
└── supabase/
    └── analysis-repository.ts    # 분석 결과 DB 저장/조회

app/
├── (dashboard)/analysis/page.tsx  # 분석 페이지 (UI)
└── api/analysis/
    ├── route.ts                   # POST /api/analysis — 분석 시작
    └── [id]/route.ts              # GET /api/analysis/[id] — 결과 조회

components/analysis/
├── url-input-form.tsx
├── dna-score-card.tsx
└── analysis-result.tsx
```

---

## AI 분석 9가지 차원

| # | 차원 | 설명 |
|---|---|---|
| 1 | 3초 후킹 영상 요소 | 오프닝 영상의 시선 끌기 기법 |
| 2 | 3초 후킹 텍스트 요소 | 첫 자막/텍스트의 구성 방식 |
| 3 | 전체 스크립트 매력도 | 대본 흐름과 설득력 |
| 4 | 캡션 분석 | 해시태그, CTA, 문체 |
| 5 | 영상미/연출 | 촬영 기법, 편집 스타일 |
| 6 | 인게이지먼트 장치 | 댓글 유도, 저장 유도, 공유 유도 |
| 7 | 콘텐츠 유형 분류 | 정보형/감성형/엔터테인먼트형 등 |
| 8 | 세일즈/소구점 | 제품/서비스 판매 요소 |
| 9 | 제작 난이도 | 기획/촬영/편집 난이도 점수 |

---

## API 설계

### POST /api/analysis
```typescript
// Request
{ url: string }

// Response (성공)
{ analysisId: string, status: 'processing' }

// Response (실패)
{ error: string }
```

### GET /api/analysis/[id]
```typescript
// Response (완료)
{
  id: string
  url: string
  platform: 'instagram' | 'tiktok' | 'youtube'
  title: string
  thumbnail: string
  scores: DnaScore[]
  transcript: string
  caption: string
  createdAt: string
}
```

---

## 파이프라인 구현 순서

1. **URL 파싱**: 플랫폼 감지 (instagram.com / tiktok.com / youtube.com)
2. **Apify 크롤링**: 플랫폼별 Actor 실행 → 미디어 URL, 자막, 캡션 추출
3. **Whisper STT**: 음성 파일 → 텍스트 변환 (자막 없는 경우)
4. **Gemini 분석**: 프롬프트 + 스크립트/메타데이터 → 9차원 점수 + 설명
5. **DB 저장**: `infrastructure/supabase/analysis-repository.ts`로 저장
6. **사용량 차감**: `domains/billing/` 연동으로 월 분석 횟수 -1

---

## 환경 변수

```bash
# .env.local에 추가 필요
APIFY_API_TOKEN=...
OPENAI_API_KEY=...
GOOGLE_GEMINI_API_KEY=...
```

> ⚠️ 서버 전용 키 — `NEXT_PUBLIC_` 접두사 사용 금지

---

## 현재 상태

- UI: ✅ 완성 (Mock 데이터)
- AI 파이프라인: 🔲 미구현
- DB 저장: 🔲 미구현
- 사용량 연동: 🔲 미구현
