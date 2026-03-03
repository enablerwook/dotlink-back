export interface CreationCard {
  id: string
  userId: string
  sourceCardAId: string | null
  sourceCardBId: string | null
  hookingPoint: string
  contentStructure: string
  differentiation: string
  keywords: string[]
  aiInsights?: string
  draft?: string
  createdAt: string
  updatedAt: string
}

export interface ComparisonResult {
  similarities: string[]
  differences: string[]
  combinationInsights: string[]
}
