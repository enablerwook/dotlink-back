import type { Platform, FrameData } from "@/lib/types"
import type { AnalysisResult } from "@/domains/analysis/types"

export type { Platform }

export interface ContentCard {
  id: string
  title: string
  platform: Platform
  url: string
  thumbnailGradient: string
  dateAnalyzed: string
  frames: FrameData[]
  analysis: AnalysisResult
}

export interface LibraryCard {
  id: string
  userId: string
  analysisId: string | null
  title: string
  platform: Platform
  thumbnailUrl?: string
  url: string
  createdAt: string
  updatedAt: string
}

export interface LibraryFilterOptions {
  platform?: Platform | "all"
  search?: string
  page?: number
  pageSize?: number
}
