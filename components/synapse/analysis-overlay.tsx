"use client"

import { X } from "lucide-react"
import { DifficultyMeter } from "@/components/analysis/difficulty-meter"
import { cn } from "@/lib/utils"
import type { ContentCard } from "@/lib/types"
import { ANALYSIS_CARD_SECTIONS } from "@/lib/analysis-tabs"

interface AnalysisOverlayProps {
  card: ContentCard
  isOpen: boolean
  onClose: () => void
}

export function AnalysisOverlay({ card, isOpen, onClose }: AnalysisOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col transition-all duration-300",
        "bg-background/85 backdrop-blur-xl",
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 rounded-full bg-foreground/10 p-1 transition-colors hover:bg-foreground/20"
        aria-label="닫기"
      >
        <X className="size-3.5" />
      </button>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
        <div className="flex flex-col gap-2.5 p-3 pt-8">
          <h4 className="text-xs font-bold text-foreground">{card.title}</h4>

          {card.analysis.engagement?.metrics && (
            <div className="grid grid-cols-3 gap-1.5 rounded-lg border bg-muted/30 p-2">
              {[
                { label: "조회수", value: card.analysis.engagement.metrics.views },
                { label: "좋아요", value: card.analysis.engagement.metrics.likes },
                { label: "댓글",   value: card.analysis.engagement.metrics.comments },
              ].map((m) => (
                <div key={m.label} className="flex flex-col items-center">
                  <span className="text-xs font-semibold tabular-nums">
                    {m.value.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          )}

          {ANALYSIS_CARD_SECTIONS.map(({ key, label }) => {
            const value = card.analysis[key as keyof typeof card.analysis]
            const text = typeof value === "string" ? value : ""
            if (!text) return null
            return (
              <div key={key}>
                <p className="mb-0.5 text-xs font-semibold text-primary">{label}</p>
                <p className="text-xs leading-relaxed text-foreground/80 line-clamp-3">{text}</p>
              </div>
            )
          })}

          {card.analysis.difficulty && (
            <div>
              <p className="mb-1 text-xs font-semibold text-primary">제작 난이도</p>
              <DifficultyMeter difficulty={card.analysis.difficulty} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
