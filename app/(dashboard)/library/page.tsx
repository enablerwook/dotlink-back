"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ContentCardComponent } from "@/components/library/content-card"
import { CardDetailModal } from "@/components/library/card-detail-modal"
import { useAppContext } from "@/domains/synapse/app-context"
import { useLibraryCards } from "@/domains/library/hooks/use-library-cards"
import type { ContentCard } from "@/lib/types"

export default function LibraryPage() {
  const { setSelectedCardA } = useAppContext()
  const { cards, loading, error } = useLibraryCards()
  const [selectedCard, setSelectedCard] = useState<ContentCard | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const router = useRouter()

  function handleSelect(card: ContentCard) {
    setSelectedCard(card)
    setModalOpen(true)
  }

  function handleSynapseClick(card: ContentCard) {
    setSelectedCardA(card)
    router.push("/synapse")
  }

  return (
    <div className="px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">라이브러리</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          분석된 콘텐츠를 저장하고 관리합니다. 카드를 클릭하면 상세 분석을 볼 수 있습니다.
        </p>
      </div>

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

      <CardDetailModal
        card={selectedCard}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
