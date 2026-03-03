# 00. 프로젝트 개요

> Last Updated: 2026-02-25
> Source: 코드 자동 분석

---

## 목차

- [1. 프로젝트 목적](#1-프로젝트-목적)
- [2. 핵심 기능](#2-핵심-기능)
- [3. 기술 스택](#3-기술-스택)
- [4. 전체 디렉토리 구조](#4-전체-디렉토리-구조)
- [5. 핵심 의존성](#5-핵심-의존성)
- [6. 환경 변수](#6-환경-변수)

---

## 1. 프로젝트 목적

**DotLink**는 숏폼 크리에이터를 위한 AI 기반 콘텐츠 DNA 분석 & 대본 생성 SaaS 플랫폼입니다.

인스타그램 릴스 / 틱톡 / 유튜브 쇼츠 URL을 입력하면 AI가 콘텐츠를 9가지 차원으로 분석하고, 분석된 콘텐츠를 라이브러리에 저장한 뒤 두 콘텐츠를 조합하여 새로운 대본을 설계하는 **Synapse** 기능을 제공합니다.

**비즈니스 모델**: 구독형 SaaS
- Starter: 무료 (월 5회 분석, 라이브러리 10개)
- Creator: ₩29,000/월 (월 50회 분석, 라이브러리 무제한)
- Pro: ₩59,000/월 (무제한, 팀 협업 5인)

---

## 2. 핵심 기능

| 기능 | 설명 | 상태 |
|---|---|---|
| **Auth** | Email/Password + Google OAuth, 라우트 보호 | ✅ 완성 |
| **DNA 분석** | URL 입력 → Apify 크롤링 → Gemini 9차원 분석 → DB 저장 | ✅ 완성 |
| **라이브러리** | 분석 결과 카드 저장/조회/즐겨찾기/메모/삭제 | ✅ 완성 |
| **시냅스** | 두 카드 AI 비교 분석 → Creation Card 생성/저장 | ✅ 완성 |
| **사용량 제한** | 플랜별 월간 분석 횟수 및 카드 수 제한 | ✅ 완성 |
| **결제 연동** | 구독 플랜 관리 (테이블만 생성) | 🔲 미구현 |
| **프레임 추출** | 실제 영상 → 대표 프레임 이미지 추출 | 🔲 미구현 |

---

## 3. 기술 스택

| 항목 | 기술 | 버전 |
|---|---|---|
| **런타임** | Node.js | — |
| **프레임워크** | Next.js (App Router) | 16.1.6 |
| **UI 라이브러리** | React | 19.2.4 |
| **언어** | TypeScript | 5.7.3 |
| **스타일링** | Tailwind CSS | 4.2.0 |
| **UI 컴포넌트** | shadcn/ui + Radix UI | 최신 |
| **데이터베이스** | Supabase (PostgreSQL) | — |
| **인증** | Supabase Auth (Email + Google OAuth) | 2.97.0 |
| **AI 분석** | Google Gemini API | 2.5-Flash / 2.0-Flash |
| **크롤링** | Apify (`apify~instagram-reel-scraper`) | — |
| **폼 처리** | React Hook Form | 7.54.1 |
| **유효성 검증** | Zod | 3.24.1 |
| **차트** | Recharts | 2.15.0 |
| **아이콘** | Lucide React | 0.564.0 |
| **토스트 알림** | Sonner | 1.7.1 |
| **캐러셀** | Embla Carousel | 8.6.0 |
| **날짜 처리** | date-fns | 4.1.0 |
| **테마** | next-themes | 0.4.6 |
| **분석** | Vercel Analytics | 1.6.1 |

---

## 4. 전체 디렉토리 구조

```
v0-dot-link-content-creation-tool-main/
├── app/                                  # Next.js App Router (얇은 레이어)
│   ├── (dashboard)/                      # 인증 보호 라우트 그룹
│   │   ├── analysis/page.tsx             # DNA 분석 페이지
│   │   ├── library/page.tsx              # 라이브러리 페이지
│   │   ├── synapse/page.tsx              # 시냅스 페이지
│   │   ├── feature-request/page.tsx      # 기능 요청 페이지
│   │   └── layout.tsx                    # AuthProvider + AppProvider 래핑
│   ├── api/                              # API Route Handlers
│   │   ├── analysis/route.ts             # POST: URL → AI 분석 → DB 저장
│   │   ├── library/
│   │   │   ├── route.ts                  # GET: 목록 / POST: 저장
│   │   │   └── [id]/route.ts             # PATCH: 수정 / DELETE: 삭제
│   │   └── synapse/
│   │       ├── route.ts                  # GET: 목록 / POST: 저장
│   │       └── compare/route.ts          # POST: 두 카드 AI 비교
│   ├── auth/callback/route.ts            # Google OAuth 콜백
│   ├── login/page.tsx                    # 로그인/회원가입 페이지
│   ├── page.tsx                          # 랜딩 페이지
│   └── layout.tsx                        # 루트 레이아웃 (Analytics 포함)
│
├── domains/                              # 비즈니스 도메인 핵심 로직 (DDD)
│   ├── auth/
│   │   ├── auth-context.tsx              # useAuth() 전역 Context
│   │   └── types.ts                      # User, Session 타입 정의
│   ├── analysis/
│   │   ├── analysis-service.ts           # 5단계 AI 분석 파이프라인
│   │   └── types.ts                      # AnalysisResult, DnaScore 등
│   ├── library/
│   │   ├── hooks/use-library-cards.ts    # useLibraryCards() 데이터 훅
│   │   └── types.ts                      # ContentCard, LibraryCard 타입
│   ├── synapse/
│   │   ├── app-context.tsx               # useAppContext() (selectedCardA)
│   │   └── types.ts                      # CreationCard, ComparisonResult
│   └── billing/
│       ├── plan-limits.ts                # PLAN_LIMITS 상수 정의
│       └── types.ts                      # Plan, Subscription, UsageRecord
│
├── infrastructure/                       # 외부 서비스 연동
│   ├── supabase/
│   │   ├── client.ts                     # 브라우저 Supabase 클라이언트
│   │   └── server.ts                     # 서버 Supabase 클라이언트 (RSC/Route Handler)
│   ├── ai/
│   │   ├── gemini-client.ts              # Gemini 9차원 분석
│   │   └── gemini-compare.ts             # Gemini 두 카드 비교 분석
│   └── apify/
│       └── apify-client.ts               # Apify Instagram 크롤러
│
├── components/                           # React UI 컴포넌트
│   ├── shared/
│   │   ├── app-sidebar.tsx               # 메인 네비게이션 사이드바
│   │   └── theme-provider.tsx            # 다크/라이트 테마 프로바이더
│   ├── analysis/
│   │   ├── url-input.tsx                 # URL 입력 폼 컴포넌트
│   │   ├── analysis-results.tsx          # 9차원 분석 결과 표시
│   │   ├── difficulty-meter.tsx          # 난이도 게이지 UI
│   │   └── frame-carousel.tsx            # 프레임 캐러셀
│   ├── library/
│   │   ├── content-card.tsx              # 라이브러리 카드 UI
│   │   └── card-detail-modal.tsx         # 카드 상세 모달
│   ├── synapse/
│   │   ├── card-stack.tsx                # 카드 선택 스택 UI
│   │   ├── comparison-card.tsx           # 비교 결과 표시
│   │   └── creation-card.tsx             # Creation Card UI
│   └── ui/                               # shadcn/ui 컴포넌트 (수정 금지)
│
├── lib/                                  # 공통 유틸리티
│   ├── types.ts                          # 공통 타입 (Platform, FrameData, ContentCard)
│   ├── mock-data.ts                      # 테스트용 Mock 데이터
│   └── utils.ts                          # cn() 유틸 함수
│
├── hooks/                                # 공통 React 훅
│   ├── use-mobile.ts                     # 모바일 감지
│   └── use-toast.ts                      # 토스트 알림
│
├── supabase/migrations/                  # DB 마이그레이션 파일
│   ├── 20260224000000_init_users.sql
│   ├── 20260225000001_analyses.sql
│   ├── 20260225000002_library_cards.sql
│   ├── 20260225000003_creation_cards.sql
│   └── 20260225000004_billing.sql
│
├── .agents/                              # 에이전트 지시서 (AI 오케스트레이션)
│   ├── auth-agent.md
│   ├── analysis-agent.md
│   ├── library-agent.md
│   ├── synapse-agent.md
│   └── billing-agent.md
│
├── .context/                             # 프로젝트 계획/기록
│   ├── current-sprint.md
│   ├── roadmap.md
│   ├── schema.md
│   ├── checklist.md
│   └── decisions.md
│
├── styles/globals.css                    # 전역 CSS (Tailwind v4)
├── public/                               # 정적 자산 (아이콘 등)
├── proxy.ts                              # Next.js 16 라우트 보호 (middleware 대체)
├── tsconfig.json
├── next.config.mjs
├── package.json
└── CLAUDE.md                             # 프로젝트 AI 에이전트 가이드
```

---

## 5. 핵심 의존성

```json
{
  "dependencies": {
    "next": "16.1.6",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "typescript": "5.7.3",
    "@google/generative-ai": "^0.24.1",
    "@supabase/ssr": "^0.8.0",
    "@supabase/supabase-js": "^2.97.0",
    "tailwindcss": "^4.2.0",
    "@tailwindcss/postcss": "^4.2.0",
    "react-hook-form": "^7.54.1",
    "zod": "^3.24.1",
    "recharts": "2.15.0",
    "lucide-react": "^0.564.0",
    "sonner": "^1.7.1",
    "date-fns": "4.1.0",
    "embla-carousel-react": "8.6.0",
    "next-themes": "^0.4.6",
    "@vercel/analytics": "^1.6.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.6.0",
    "cmdk": "^1.1.1"
  }
}
```

---

## 6. 환경 변수

| 변수명 | 필수 여부 | 설명 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필수 | Supabase 공개 익명 키 |
| `GOOGLE_GEMINI_API_KEY` | 필수 | Google Gemini API 키 (분석 불가 시 사용 불가) |
| `APIFY_API_TOKEN` | 선택 | Apify 크롤링 토큰 (미설정 시 URL만으로 기본 분석) |
| `OPENAI_API_KEY` | 미래 | OpenAI Whisper STT (향후 구현) |

> **참고 문서**: [01_domain_model.md](./01_domain_model.md) | [04_api_spec.md](./04_api_spec.md) | [05_architecture.md](./05_architecture.md)
