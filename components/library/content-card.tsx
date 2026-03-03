"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, X, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DifficultyMeter } from "@/components/analysis/difficulty-meter"
import type { ContentCard } from "@/lib/types"

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500/20 text-pink-400",
  tiktok: "bg-cyan-500/20 text-cyan-400",
  youtube: "bg-red-500/20 text-red-400",
}

// 카드 뒷면에 표시할 분석 섹션 (string 필드만)
const analysisSections: { key: string; label: string }[] = [
  { key: "hook_analysis",   label: "3초 후킹 영상" },
  { key: "content_type",    label: "콘텐츠 유형" },
  { key: "production_note", label: "촬영/편집 스타일" },
  { key: "selling_point",   label: "세일즈/소구점" },
]

export function ContentCardComponent({
  card,
  onSelect,
  onSynapseClick,
}: {
  card: ContentCard
  onSelect: (card: ContentCard) => void
  onSynapseClick: (card: ContentCard) => void
}) {
  const [frameIndex, setFrameIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card transition-colors hover:border-border">
      {/* Frame carousel area - 9:12 aspect ratio */}
      <div
        className="relative cursor-pointer"
        style={{ aspectRatio: "9/12" }}
        onClick={() => setIsFlipped(true)}
      >
        {card.frames[frameIndex].imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={card.frames[frameIndex].imageUrl}
            alt={card.frames[frameIndex].label}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br",
                card.frames[frameIndex].gradient,
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-foreground/50">
                {card.frames[frameIndex].label}
              </span>
            </div>
          </>
        )}

        {/* Nav arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setFrameIndex((i) => (i === 0 ? card.frames.length - 1 : i - 1))
          }}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="이전 프레임"
        >
          <ChevronLeft className="size-3.5" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            setFrameIndex((i) => (i === card.frames.length - 1 ? 0 : i + 1))
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1 opacity-0 transition-opacity group-hover:opacity-100"
          aria-label="다음 프레임"
        >
          <ChevronRight className="size-3.5" />
        </button>

        {/* Frame indicator */}
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-0.5">
          {card.frames.slice(0, 15).map((_, i) => (
            <div
              key={i}
              className={cn(
                "size-1 rounded-full transition-colors",
                i === frameIndex ? "bg-foreground" : "bg-foreground/30",
              )}
            />
          ))}
        </div>

        {/* Platform badge */}
        <Badge
          className={cn(
            "absolute top-2 left-2 border-0 text-[10px] capitalize",
            platformColors[card.platform],
          )}
        >
          {card.platform}
        </Badge>

        {/* Synapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSynapseClick(card)
          }}
          className="absolute top-2 right-2 rounded-full bg-primary/80 p-1.5 text-primary-foreground opacity-0 transition-opacity hover:bg-primary group-hover:opacity-100"
          aria-label="시냅스로 보내기"
        >
          <Zap className="size-3.5" />
        </button>

        {/* 글래스 오버레이 — 분석 요약 */}
        <div
          className={cn(
            "absolute inset-0 flex flex-col transition-all duration-300",
            "bg-background/85 backdrop-blur-xl",
            isFlipped
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 닫기 버튼 */}
          <button
            onClick={() => setIsFlipped(false)}
            className="absolute top-2 right-2 z-10 rounded-full bg-foreground/10 p-1 transition-colors hover:bg-foreground/20"
            aria-label="닫기"
          >
            <X className="size-3.5" />
          </button>

          <ScrollArea className="h-full">
            <div className="flex flex-col gap-2.5 p-3 pt-8">
              <h4 className="text-xs font-bold text-foreground">{card.title}</h4>

              {analysisSections.map(({ key, label }) => {
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

              <div>
                <p className="mb-1 text-xs font-semibold text-primary">제작 난이도</p>
                <DifficultyMeter difficulty={card.analysis.difficulty} />
              </div>

              {/* 상세 보기 버튼 */}
              <button
                onClick={() => {
                  setIsFlipped(false)
                  onSelect(card)
                }}
                className="mt-1 w-full rounded-md bg-primary/10 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
              >
                상세 보기 / 수정
              </button>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Card info */}
      <div className="flex flex-col gap-1 p-3">
        <h3
          className="cursor-pointer truncate text-sm font-medium hover:text-primary"
          onClick={() => onSelect(card)}
        >
          {card.title}
        </h3>
        <p className="text-xs text-muted-foreground">{card.dateAnalyzed}</p>
      </div>
    </div>
  )
}
