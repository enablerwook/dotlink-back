export type Platform = "instagram" | "tiktok" | "youtube"

export interface FrameData {
  id: number
  imageUrl?: string    // Supabase Storage 업로드 URL (실제 프레임)
  timestamp?: number   // 영상 내 타임스탬프 (초)
  gradient: string     // 실제 이미지 없을 때 fallback 그라디언트
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

export interface AnalysisResult {
  hook_analysis: string       // 3초 후킹 영상 분석 (Gemini)
  hook_text: string           // 첫 5초 발화 텍스트 (Whisper STT, 없으면 "")
  full_script: string         // 전체 대본 (Whisper STT, 없으면 "")
  caption: string             // 원본 캡션 & 해시태그 (Apify)
  production_note: string     // 시청 지속시간 유지 요인 분석 (Gemini)
  engagement: EngagementData  // 지표(Apify) + 분석(Gemini)
  content_type: string        // 콘텐츠 유형 분류 (Gemini)
  selling_point: string       // 판매/설득 포인트 분석 (Gemini)
  difficulty: DifficultyRating // 제작 난이도 (Gemini)
}

export interface ContentCard {
  id: string
  title: string
  platform: Platform
  url: string
  thumbnailGradient: string
  dateAnalyzed: string
  frames: FrameData[]
  analysis: AnalysisResult
  tags: string[]
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
