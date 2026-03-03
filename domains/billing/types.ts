export type Plan = "starter" | "creator" | "pro"
export type SubscriptionStatus = "active" | "canceled" | "past_due"

export interface Subscription {
  id: string
  userId: string
  plan: Plan
  status: SubscriptionStatus
  currentPeriodEnd?: string
  paymentCustomerId?: string
  paymentSubId?: string
  createdAt: string
  updatedAt: string
}

export interface UsageRecord {
  id: string
  userId: string
  yearMonth: string    // 'YYYY-MM' 형식
  analysisCount: number
}

export interface PlanLimit {
  monthlyAnalysis: number
  libraryCards: number
  teamMembers: number
}
