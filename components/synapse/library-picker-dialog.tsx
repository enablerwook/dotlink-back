"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/locale-context"
import type { ContentCard } from "@/lib/types"

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500/20 text-pink-400",
  tiktok:    "bg-cyan-500/20 text-cyan-400",
  youtube:   "bg-red-500/20 text-red-400",
}

interface LibraryPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cards: ContentCard[]
  onSelect: (card: ContentCard) => void
  excludeCardId?: string
  slotLabel: string
}

export function LibraryPickerDialog({
  open,
  onOpenChange,
  cards,
  onSelect,
  excludeCardId,
  slotLabel,
}: LibraryPickerDialogProps) {
  const { t } = useLocale()
  const [query, setQuery] = useState("")

  const filteredCards = cards
    .filter((c) => c.id !== excludeCardId)
    .filter(
      (c) =>
        !query ||
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.platform.toLowerCase().includes(query.toLowerCase()),
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-base font-semibold">
            {slotLabel} — {t.synapseSelectCard}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t.synapsePickFromLibrary}
          </DialogDescription>
        </DialogHeader>

        <div className="border-b px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.synapseSelectCard}
              className="pl-9 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredCards.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">{t.synapseLibraryEmpty}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
              {filteredCards.map((card) => (
                <PickerCard
                  key={card.id}
                  card={card}
                  onSelect={() => {
                    onSelect(card)
                    onOpenChange(false)
                    setQuery("")
                  }}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

function PickerCard({
  card,
  onSelect,
}: {
  card: ContentCard
  onSelect: () => void
}) {
  const [frameIndex, setFrameIndex] = useState(0)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border/50 bg-card text-left transition-all hover:border-primary/60 hover:ring-1 hover:ring-primary/30"
    >
      <div className="relative" style={{ aspectRatio: "9/12" }}>
        {card.frames[frameIndex]?.imageUrl ? (
          <img
            src={card.frames[frameIndex].imageUrl}
            alt={card.frames[frameIndex].label ?? ""}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br",
              card.frames[frameIndex]?.gradient ?? "",
            )}
          />
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] text-foreground/50">
            {card.frames[frameIndex]?.imageUrl ? "" : (card.frames[frameIndex]?.label ?? "")}
          </span>
        </div>

        {card.frames.length > 1 && (
          <>
            <div
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                setFrameIndex((i) => (i === 0 ? card.frames.length - 1 : i - 1))
              }}
              className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ChevronLeft className="size-3" />
            </div>
            <div
              role="button"
              tabIndex={-1}
              onClick={(e) => {
                e.stopPropagation()
                setFrameIndex((i) => (i === card.frames.length - 1 ? 0 : i + 1))
              }}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <ChevronRight className="size-3" />
            </div>
          </>
        )}

        <Badge
          className={cn(
            "absolute left-1.5 top-1.5 border-0 text-[9px] capitalize",
            platformColors[card.platform] ?? "",
          )}
        >
          {card.platform}
        </Badge>

        <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-0.5">
          {card.frames.slice(0, 10).map((_, i) => (
            <div
              key={i}
              className={cn(
                "size-0.5 rounded-full transition-colors",
                i === frameIndex ? "bg-foreground" : "bg-foreground/30",
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 p-2">
        <h4 className="truncate text-xs font-medium text-foreground">{card.title}</h4>
        <p className="text-[10px] text-muted-foreground">
          {card.postedAt ?? card.dateAnalyzed}
        </p>
      </div>
    </button>
  )
}
