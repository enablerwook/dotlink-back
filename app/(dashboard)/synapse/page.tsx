"use client"

import { useState } from "react"
import { useLibraryCards } from "@/domains/library/hooks/use-library-cards"
import { useLocale } from "@/lib/locale-context"
import { ComparisonCard } from "@/components/synapse/comparison-card"
import { EmptyCardSlot } from "@/components/synapse/empty-card-slot"
import { LibraryPickerDialog } from "@/components/synapse/library-picker-dialog"
import { CreationCard } from "@/components/synapse/creation-card"
import type { ContentCard } from "@/lib/types"

export default function SynapsePage() {
  const { t } = useLocale()
  const { cards: libraryCards, loading } = useLibraryCards()

  const [cardA, setCardA] = useState<ContentCard | null>(null)
  const [cardB, setCardB] = useState<ContentCard | null>(null)
  const [pickerOpen, setPickerOpen] = useState<"A" | "B" | null>(null)

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col px-4 py-6">
      {/* 헤더 */}
      <div className="mb-6 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight text-balance">{t.synapseTitle}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.synapseDesc}</p>
      </div>

      {/* 3열 레이아웃 */}
      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden md:grid-cols-3">
        {/* Card A */}
        <div className="min-h-0 overflow-hidden">
          {cardA ? (
            <ComparisonCard
              card={cardA}
              label="Card A"
              onReplace={() => setPickerOpen("A")}
            />
          ) : (
            <EmptyCardSlot label="Card A" onClick={() => setPickerOpen("A")} />
          )}
        </div>

        {/* Card B */}
        <div className="min-h-0 overflow-hidden">
          {cardB ? (
            <ComparisonCard
              card={cardB}
              label="Card B"
              onReplace={() => setPickerOpen("B")}
            />
          ) : (
            <EmptyCardSlot label="Card B" onClick={() => setPickerOpen("B")} />
          )}
        </div>

        {/* Creation Card */}
        <div className="min-h-0 overflow-hidden">
          <CreationCard
            sourceCardAId={cardA?.id}
            sourceCardBId={cardB?.id}
          />
        </div>
      </div>

      {/* 라이브러리 카드 선택 팝업 */}
      <LibraryPickerDialog
        open={pickerOpen !== null}
        onOpenChange={(open) => { if (!open) setPickerOpen(null) }}
        cards={libraryCards}
        excludeCardId={pickerOpen === "A" ? cardB?.id : cardA?.id}
        slotLabel={pickerOpen === "A" ? "Card A" : "Card B"}
        onSelect={(card) => {
          if (pickerOpen === "A") setCardA(card)
          else setCardB(card)
        }}
      />
    </div>
  )
}
