"use client"

import { ChevronUp, ChevronDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { DifficultyMeter } from "@/components/analysis/difficulty-meter"
import type { ContentCard } from "@/lib/types"

const sections = [
  { key: "hookVisual", label: "3초 후킹 영상 요소" },
  { key: "hookText", label: "3초 후킹 텍스트 요소" },
  { key: "scriptAppeal", label: "전체 스크립트 매력도" },
  { key: "captionAnalysis", label: "캡션 분석" },
  { key: "visualDirection", label: "영상미/연출" },
  { key: "engagementDevices", label: "인게이지먼트 장치" },
  { key: "contentType", label: "콘텐츠 유형 분류" },
  { key: "salesPoints", label: "세일즈/소구점" },
] as const

export function CardStack({
  cards,
  currentIndex,
  onPrev,
  onNext,
}: {
  cards: ContentCard[]
  currentIndex: number
  onPrev: () => void
  onNext: () => void
}) {
  const current = cards[currentIndex]
  const nextCard = cards[(currentIndex + 1) % cards.length]

  return (
    <div className="relative flex h-full flex-col">
      {/* Navigation */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-3 rounded-t-xl border-x border-t border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">Card B</span>
          <Badge variant="outline" className="text-[10px] capitalize">
            {current.platform}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            className="rounded p-1 hover:bg-accent"
            aria-label="이전 카드"
          >
            <ChevronUp className="size-4" />
          </button>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1}/{cards.length}
          </span>
          <button
            onClick={onNext}
            className="rounded p-1 hover:bg-accent"
            aria-label="다음 카드"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>

      {/* Current card (B) */}
      <div className="relative z-10 flex-1 overflow-hidden rounded-b-xl border-x border-b border-border/50 bg-card">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-4 p-4">
            <h3 className="text-sm font-semibold">{current.title}</h3>
            {sections.map(({ key, label }) => (
              <div key={key}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-xs leading-relaxed">{current.analysis[key]}</p>
              </div>
            ))}
            <Separator />
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">제작 난이도</p>
              <DifficultyMeter difficulty={current.analysis.difficulty} />
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Next card preview (C) - peeking from below at 50% opacity */}
      {cards.length > 1 && (
        <div className="absolute -bottom-3 left-3 right-3 z-0 h-12 rounded-b-xl border border-border/30 bg-card/50 opacity-50" />
      )}
    </div>
  )
}
