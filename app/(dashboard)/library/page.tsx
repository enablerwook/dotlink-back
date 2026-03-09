"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ContentCardComponent } from "@/components/library/content-card"
import { CardDetailModal } from "@/components/library/card-detail-modal"
import { CreationDetailModal } from "@/components/library/creation-detail-modal"
import { useAppContext } from "@/domains/synapse/app-context"
import { useLibraryCards } from "@/domains/library/hooks/use-library-cards"
import type { AnalysisResult, ContentCard } from "@/lib/types"
import type { CreationCard } from "@/domains/synapse/types"

type LibraryTab = "analysis" | "creation"

export default function LibraryPage() {
  const { setSelectedCardA } = useAppContext()
  const { cards, loading, error, updateAnalysis } = useLibraryCards()
  const [tab, setTab] = useState<LibraryTab>("analysis")

  // 분석 카드 모달 상태
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  // 크리에이션 카드 상태
  const [creationCards, setCreationCards] = useState<CreationCard[]>([])
  const [creationLoading, setCreationLoading] = useState(false)
  const [selectedCreation, setSelectedCreation] = useState<CreationCard | null>(null)
  const [creationModalOpen, setCreationModalOpen] = useState(false)

  const router = useRouter()

  useEffect(() => {
    if (tab !== "creation") return
    setCreationLoading(true)
    fetch("/api/synapse")
      .then((r) => r.json())
      .then((data) => setCreationCards(data.cards ?? []))
      .catch(() => setCreationCards([]))
      .finally(() => setCreationLoading(false))
  }, [tab])

  function handleSelect(card: ContentCard) {
    setSelectedCard(card)
    setModalOpen(true)
  }

  function handleSynapseClick(card: ContentCard) {
    setSelectedCardA(card)
    router.push("/synapse")
  }

  async function handleUpdateAnalysis(id: string, analysis: AnalysisResult) {
    await updateAnalysis(id, analysis)
    setSelectedCard((prev) => (prev?.id === id ? { ...prev, analysis } : prev))
  }

  return (
    <div className="px-4 py-8">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">라이브러리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          분석된 콘텐츠와 나만의 기획안을 저장하고 관리합니다.
        </p>
      </div>

      {/* 탭 */}
      <div className="mb-6 flex gap-1 border-b">
        <button
          type="button"
          onClick={() => setTab("analysis")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "analysis"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          분석 카드
        </button>
        <button
          type="button"
          onClick={() => setTab("creation")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            tab === "creation"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          크리에이션 카드
        </button>
      </div>

      {/* 분석 카드 탭 */}
      {tab === "analysis" && (
        <>
          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {error && (
            <p className="py-8 text-center text-sm text-destructive">{error}</p>
          )}
          {!loading && !error && cards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm font-medium">아직 저장된 콘텐츠가 없습니다</p>
              <p className="mt-1 text-xs text-muted-foreground">
                분석 페이지에서 콘텐츠를 분석하고 라이브러리에 저장해보세요.
              </p>
            </div>
          )}
          {!loading && cards.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {cards.map((card) => (
                <ContentCardComponent
                  key={card.id}
                  card={card}
                  onSelect={handleSelect}
                  onSynapseClick={handleSynapseClick}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* 크리에이션 카드 탭 */}
      {tab === "creation" && (
        <>
          {creationLoading && (
            <div className="flex items-center justify-center py-24">
              <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
          {!creationLoading && creationCards.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-sm font-medium">저장된 기획안이 없습니다</p>
              <p className="mt-1 text-xs text-muted-foreground">
                시냅스 페이지에서 기획안을 작성하고 저장해보세요.
              </p>
            </div>
          )}
          {!creationLoading && creationCards.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {creationCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => { setSelectedCreation(card); setCreationModalOpen(true) }}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-card p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <p className="text-sm font-semibold truncate">
                    {card.title ?? "제목 없음"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(card.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                  <p className="text-xs text-primary">
                    {Object.values(card.steps).filter((v) => v.trim().length > 0).length}/9 단계 작성됨
                  </p>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* 분석 카드 상세 모달 */}
      <CardDetailModal
        card={selectedCard}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onUpdate={handleUpdateAnalysis}
      />

      {/* 크리에이션 카드 상세 모달 */}
      <CreationDetailModal
        creation={selectedCreation
          ? {
              id: selectedCreation.id,
              title: selectedCreation.title ?? undefined,
              savedAt: selectedCreation.createdAt,
              values: selectedCreation.steps as unknown as Record<string, string>,
              droppedFrames: selectedCreation.droppedFrames,
            }
          : null
        }
        open={creationModalOpen}
        onOpenChange={setCreationModalOpen}
      />
    </div>
  )
}
