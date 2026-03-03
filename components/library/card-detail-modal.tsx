"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AnalysisResults } from "@/components/analysis/analysis-results"
import type { AnalysisResult, ContentCard } from "@/lib/types"

export function CardDetailModal({
  card,
  open,
  onOpenChange,
  onUpdate,
}: {
  card: ContentCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: (id: string, analysis: AnalysisResult) => void
}) {
  if (!card) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg">{card.title}</DialogTitle>
            <Badge variant="outline" className="capitalize">
              {card.platform}
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            {card.dateAnalyzed} 분석됨
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(85vh-6rem)]">
          <div className="px-6 pb-6">
            <AnalysisResults
              card={card}
              onUpdate={onUpdate ? (analysis) => onUpdate(card.id, analysis) : undefined}
            />
            {card.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
