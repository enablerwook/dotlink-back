import type { Plan, PlanLimit } from "./types"

export const PLAN_LIMITS: Record<Plan, PlanLimit> = {
  starter: {
    monthlyAnalysis: 5,
    libraryCards: 10,
    teamMembers: 1,
  },
  creator: {
    monthlyAnalysis: 50,
    libraryCards: Infinity,
    teamMembers: 1,
  },
  pro: {
    monthlyAnalysis: Infinity,
    libraryCards: Infinity,
    teamMembers: 5,
  },
}
