"use client"

import { useState, useMemo } from "react"
import { useAppContext } from "@/domains/synapse/app-context"
import { useLibraryCards } from "@/domains/library/hooks/use-library-cards"
import { ComparisonCard } from "@/components/synapse/comparison-card"
import { CardStack } from "@/components/synapse/card-stack"
import { CreationCard } from "@/components/synapse/creation-card"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import type { CompareResult } from "@/infrastructure/ai/gemini-compare"

export default function SynapsePage() {
  const { selectedCardA } = useAppContext()
  const { cards: libraryCards, loading } = useLibraryCards()
  const [bIndex, setBIndex] = useState(0)
  const [comparing, setComparing] = useState(false)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null)

  // Card A: either selected from library or fall back to first card
  const cardA = selectedCardA ?? libraryCards[0]

  // Cards for B slot: all cards except A
  const bCards = useMemo(
    () => libraryCards.filter((c) => c.id !== cardA?.id),
    [libraryCards, cardA],
  )

  const cardB = bCards[bIndex]

  function handlePrevB() {
    setBIndex((i) => (i === 0 ? bCards.length - 1 : i - 1))
    setCompareResult(null)
  }

  function handleNextB() {
    setBIndex((i) => (i === bCards.length - 1 ? 0 : i + 1))
    setCompareResult(null)
  }

  async function handleCompare() {
    if (!cardA || !cardB) return
    setComparing(true)
    setCompareError(null)
    setCompareResult(null)
    try {
      const res = await fetch("/api/synapse/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardAId: cardA.id, cardBId: cardB.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        setCompareError(data.error ?? "비교 분석에 실패했습니다.")
      } else {
        setCompareResult(data.result as CompareResult)
      }
    } catch {
      setCompareError("서버에 연결할 수 없습니다.")
    } finally {
      setComparing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!cardA || bCards.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">분석된 콘텐츠가 필요합니다</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            먼저 콘텐츠를 분석하고 라이브러리에 저장해주세요. (최소 2개 필요)
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col px-4 py-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">시냅스</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            두 콘텐츠를 비교 분석하고 새로운 콘텐츠를 설계하세요.
          </p>
        </div>
        <Button
          onClick={handleCompare}
          disabled={comparing || !cardA || !cardB}
          size="sm"
          className="gap-2"
        >
          <Sparkles className="size-4" />
          {comparing ? "AI 분석 중..." : "AI 비교 분석"}
        </Button>
      </div>

      {compareError && (
        <div className="mb-3 rounded-lg bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {compareError}
        </div>
      )}

      {comparing && (
        <div className="mb-3 rounded-lg bg-primary/5 px-4 py-2 text-sm text-muted-foreground">
          두 콘텐츠를 AI가 비교 분석 중입니다. 15~30초 소요될 수 있습니다...
        </div>
      )}

      <div className="grid flex-1 gap-4 overflow-hidden md:grid-cols-3" style={{ minHeight: 0 }}>
        {/* Card A */}
        <div className="min-h-0 overflow-hidden">
          <ComparisonCard card={cardA} label="Card A" />
        </div>

        {/* Card B (stacked) */}
        <div className="relative min-h-0 overflow-hidden pb-4">
          <CardStack
            cards={bCards}
            currentIndex={bIndex}
            onPrev={handlePrevB}
            onNext={handleNextB}
          />
        </div>

        {/* Creation Card */}
        <div className="min-h-0 overflow-hidden">
          <CreationCard
            aiSuggestions={compareResult}
            cardAId={cardA?.id}
            cardBId={cardB?.id}
            aiInsights={compareResult?.aiInsights}
            differentiation={compareResult?.differentiation}
            keywords={compareResult?.keywords}
          />
        </div>
      </div>
    </div>
  )
}
