"use client"

import { useState, useEffect } from "react"
import { Search, Zap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import type { CreationCard } from "@/domains/synapse/types"

interface CreationPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (card: CreationCard) => void
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function CreationPickerDialog({
  open,
  onOpenChange,
  onSelect,
}: CreationPickerDialogProps) {
  const [cards, setCards] = useState<CreationCard[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch("/api/synapse")
      .then((r) => r.json())
      .then((data) => setCards(data.cards ?? []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }, [open])

  const filtered = cards.filter(
    (c) =>
      !query ||
      (c.title ?? "").toLowerCase().includes(query.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-base font-semibold">
            기획안 불러오기
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            저장된 기획안을 선택하면 현재 작성 공간에 불러옵니다.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목으로 검색..."
              className="pl-9 text-sm"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="text-sm text-muted-foreground">
                {cards.length === 0 ? "저장된 기획안이 없습니다." : "검색 결과가 없습니다."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {filtered.map((card) => {
                const filledCount = Object.values(card.steps).filter(
                  (v) => v.trim().length > 0,
                ).length
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      onSelect(card)
                      onOpenChange(false)
                      setQuery("")
                    }}
                    className="flex items-center justify-between px-6 py-4 text-left hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {card.title ?? "제목 없음"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(card.createdAt)}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary shrink-0"
                    >
                      <Zap className="mr-1 size-3" />
                      {filledCount}/9
                    </Badge>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
