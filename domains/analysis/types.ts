// Phase 9: 모든 분석 타입을 lib/types.ts에서 re-export (단일 소스)
export type {
  DifficultyRating,
  EngagementMetrics,
  EngagementData,
  AnalysisResult,
} from "@/lib/types"

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed"
