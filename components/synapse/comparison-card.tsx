"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ContentCard } from "@/lib/types"
import type { DroppedFrame } from "@/domains/synapse/types"
import { AnalysisOverlay } from "@/components/synapse/analysis-overlay"
import { setActiveDragFrame } from "@/domains/synapse/drag-state"

const platformColors: Record<string, string> = {
  instagram: "bg-pink-500/20 text-pink-400",
  tiktok:    "bg-cyan-500/20 text-cyan-400",
  youtube:   "bg-red-500/20 text-red-400",
}

export function ComparisonCard({
  card,
  label,
  onReplace,
}: {
  card: ContentCard
  label: string
  onReplace?: () => void
}) {
  const [frameIndex, setFrameIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  function handleFrameDragStart(e: React.DragEvent, idx: number) {
    const frame = card.frames[idx]
    const droppedFrame: DroppedFrame = {
      id:         `${card.id}-frame-${frame.id}`,
      gradient:   frame.gradient,
      label:      frame.label,
      sourceCard: label,
      imageUrl:   frame.imageUrl,
    }
    // 모듈 변수에 저장 — dataTransfer.getData()의 Chrome 보안 제한 우회
    setActiveDragFrame(droppedFrame)
    // "1"은 신호용 (실제 데이터 아님) — dragenter의 types.includes() 체크에 사용됨
    e.dataTransfer.setData("application/dotlink-frame", "1")
    e.dataTransfer.effectAllowed = "copy"
  }

  function handleFrameDragEnd() {
    setActiveDragFrame(null)
  }

  const activeFrame = card.frames[frameIndex]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
      {/* 헤더 */}
      <div className="flex flex-none items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">{label}</span>
          <Badge variant="outline" className="text-[10px] capitalize">
            {card.platform}
          </Badge>
        </div>
        {onReplace && (
          <button
            type="button"
            onClick={onReplace}
            className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
          >
            교체
          </button>
        )}
      </div>

      {/* 프레임 영역 — 클릭: 분석 오버레이 / 드래그: 프레임을 Creation Card에 드롭 */}
      <div
        className="group relative flex-1 min-h-0 cursor-grab active:cursor-grabbing overflow-hidden"
        draggable
        onDragStart={(e) => handleFrameDragStart(e, frameIndex)}
        onDragEnd={handleFrameDragEnd}
        onClick={() => setIsFlipped(true)}
      >
        {/* 현재 프레임 — draggable={false}로 브라우저 기본 이미지 드래그 방지 */}
        {activeFrame.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeFrame.imageUrl}
            alt={activeFrame.label}
            draggable={false}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div
              className={cn(
                "absolute inset-0 bg-gradient-to-br",
                activeFrame.gradient,
              )}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-foreground/50">{activeFrame.label}</span>
            </div>
          </>
        )}

        {/* 이전/다음 버튼 */}
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

        {/* 프레임 인디케이터 */}
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

        {/* 플랫폼 뱃지 */}
        <Badge
          className={cn(
            "absolute top-2 left-2 border-0 text-[10px] capitalize",
            platformColors[card.platform],
          )}
        >
          {card.platform}
        </Badge>

        {/* 분석 오버레이 */}
        <AnalysisOverlay
          card={card}
          isOpen={isFlipped}
          onClose={() => setIsFlipped(false)}
        />
      </div>

      {/* 드래그 가능한 썸네일 스트립 */}
      <div className="flex flex-none items-center gap-1 border-t overflow-x-auto px-3 py-2 scrollbar-hide">
        {card.frames.slice(0, 15).map((frame, i) => (
          // Root Cause 3 fix: <button draggable> is unreliable in Safari — use div instead
          <div
            key={frame.id}
            role="button"
            tabIndex={0}
            draggable
            onDragStart={(e) => handleFrameDragStart(e, i)}
            onDragEnd={handleFrameDragEnd}
            onClick={() => setFrameIndex(i)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setFrameIndex(i) }}
            className={cn(
              "relative size-8 shrink-0 overflow-hidden rounded cursor-grab active:cursor-grabbing transition-all",
              i === frameIndex
                ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                : "opacity-50 hover:opacity-80",
            )}
            aria-label={`프레임 ${i + 1} (드래그 가능)`}
          >
            {frame.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frame.imageUrl}
                alt={frame.label}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className={cn("absolute inset-0 bg-gradient-to-br", frame.gradient)} />
            )}
          </div>
        ))}
      </div>

      {/* 카드 정보 푸터 */}
      <div className="flex flex-none flex-col gap-0.5 px-3 pb-3">
        <h3 className="truncate text-xs font-medium">{card.title}</h3>
        <p className="text-[10px] text-muted-foreground">{card.postedAt ?? card.dateAnalyzed}</p>
      </div>
    </div>
  )
}
