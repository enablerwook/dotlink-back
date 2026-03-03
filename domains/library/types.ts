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
  tags: string[]
}

export interface LibraryCard {
  id: string
  userId: string
  analysisId: string
  title: string
  platform: Platform
  thumbnail?: string
  url: string
  scores?: Record<string, unknown>
  note?: string
  isFavorite: boolean
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface LibraryFilterOptions {
  platform?: Platform | "all"
  search?: string
  onlyFavorites?: boolean
  page?: number
  pageSize?: number
}
