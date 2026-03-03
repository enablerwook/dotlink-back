import type { FeatureRequest } from "./types"

export const mockFeatureRequests: FeatureRequest[] = [
  {
    id: "fr-1",
    title: "AI 자동 대본 생성 기능",
    description:
      "분석된 DNA를 기반으로 AI가 자동으로 새로운 대본을 생성해주는 기능이 있으면 좋겠습니다. 카드 A와 B의 요소를 조합하여 완전히 새로운 대본을 만들어주세요.",
    category: "AI 기능",
    priority: "high",
    upvotes: 47,
    author: "크리에이터A",
    dateSubmitted: "2026-02-18",
    hasUpvoted: false,
  },
  {
    id: "fr-2",
    title: "팀 협업 기능",
    description:
      "여러 팀원이 함께 라이브러리를 공유하고 시냅스 작업을 할 수 있는 협업 기능을 요청합니다.",
    category: "협업",
    priority: "medium",
    upvotes: 32,
    author: "마케터B",
    dateSubmitted: "2026-02-15",
    hasUpvoted: true,
  },
  {
    id: "fr-3",
    title: "트렌드 대시보드",
    description:
      "현재 인기 있는 콘텐츠 트렌드를 실시간으로 분석하여 대시보드로 보여주는 기능을 추가해주세요.",
    category: "분석",
    priority: "high",
    upvotes: 28,
    author: "인플루언서C",
    dateSubmitted: "2026-02-12",
    hasUpvoted: false,
  },
  {
    id: "fr-4",
    title: "내보내기 (PDF/노션)",
    description:
      "분석 결과와 작성한 대본을 PDF나 노션으로 내보낼 수 있는 기능이 필요합니다.",
    category: "유틸리티",
    priority: "medium",
    upvotes: 21,
    author: "프리랜서D",
    dateSubmitted: "2026-02-10",
    hasUpvoted: false,
  },
  {
    id: "fr-5",
    title: "경쟁사 분석 비교",
    description:
      "같은 카테고리의 경쟁 계정 콘텐츠를 자동으로 분석하고 비교해주는 기능을 추가해주세요.",
    category: "분석",
    priority: "low",
    upvotes: 15,
    author: "스타트업E",
    dateSubmitted: "2026-02-08",
    hasUpvoted: true,
  },
]

export const pricingPlans = [
  {
    name: "Starter",
    nameKo: "스타터",
    price: "무료",
    description: "숏폼 분석을 처음 시작하는 분들을 위한 플랜",
    features: [
      "월 5회 콘텐츠 분석",
      "기본 9단계 DNA 분석",
      "라이브러리 저장 (최대 10개)",
      "시냅스 비교 기능",
    ],
    cta: "무료로 시작하기",
    highlighted: false,
  },
  {
    name: "Creator",
    nameKo: "크리에이터",
    price: "29,000",
    period: "월",
    description: "본격적으로 콘텐츠를 제작하는 크리에이터를 위한 플랜",
    features: [
      "월 50회 콘텐츠 분석",
      "고급 DNA 분석 + AI 인사이트",
      "무제한 라이브러리 저장",
      "시냅스 AI 재조합 대본",
      "트렌드 리포트 (주간)",
      "내보내기 기능",
    ],
    cta: "크리에이터 시작하기",
    highlighted: true,
  },
  {
    name: "Pro",
    nameKo: "프로",
    price: "59,000",
    period: "월",
    description: "팀과 에이전시를 위한 전문 플랜",
    features: [
      "무제한 콘텐츠 분석",
      "최고급 DNA 분석 + 멀티 AI",
      "무제한 라이브러리 저장",
      "시냅스 AI 재조합 대본 (무제한)",
      "실시간 트렌드 대시보드",
      "팀 협업 (최대 5명)",
      "API 접근",
      "우선 고객 지원",
    ],
    cta: "프로 시작하기",
    highlighted: false,
  },
]
