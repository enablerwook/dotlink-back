export type Platform = "instagram" | "tiktok" | "youtube"

export interface FrameData {
  id: number
  imageUrl?: string      // 서명된 URL (브라우저 표시용, 24시간 유효)
  storagePath?: string   // Storage 경로 ({userId}/{analysisId}/frame-{n}.jpg) — 서명 URL 갱신 시 사용
  timestamp?: number     // 영상 내 타임스탬프 (초)
  gradient: string       // 실제 이미지 없을 때 fallback 그라디언트
  label: string
}

export interface DifficultyRating {
  planning: number // 1-5
  filming: number  // 1-5
  editing: number  // 1-5
}

export interface EngagementMetrics {
  likes: number
  views: number
  comments: number
}

export interface EngagementData {
  metrics: EngagementMetrics
  analysis: string
}

/**
 * 분석 결과 도메인 타입
 * UI 탭 순서: 유형 | 후킹 | 스크립트 | 캡션 | 연출 | 인게이지먼트 | 세일즈 | 제작 난이도
 */
export interface AnalysisResult {
  content_type:  string          // 유형       — Gemini System2
  hooking:       string          // 후킹       — Gemini System2 (첫 5초/150프레임 분석)
  script:        string          // 스크립트   — Gemini System2 (전체 대본)
  caption:       string          // 캡션       — Apify 원본
  production:    string          // 연출       — Gemini System2
  engagement:    EngagementData  // 인게이지먼트 — Apify 지표 + Gemini 분석 텍스트
  selling_point: string          // 세일즈     — Gemini System2
  difficulty:    DifficultyRating // 제작 난이도 — Gemini System2
}

export interface ContentCard {
  id: string
  title: string
  platform: Platform
  url: string
  thumbnailGradient: string
  postedAt?: string      // Instagram 게시 날짜 (Apify timestamp)
  dateAnalyzed: string   // 분석 생성 날짜 (created_at fallback)
  frames: FrameData[]
  analysis: AnalysisResult
}

export interface FeatureRequest {
  id: string
  title: string
  description: string
  category: string
  priority: "low" | "medium" | "high"
  upvotes: number
  author: string
  dateSubmitted: string
  hasUpvoted: boolean
}
