"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FrameData } from "@/lib/types"

export function FrameCarousel({ frames }: { frames: FrameData[] }) {
  const [current, setCurrent] = useState(0)

  function prev() {
    setCurrent((c) => (c === 0 ? frames.length - 1 : c - 1))
  }

  function next() {
    setCurrent((c) => (c === frames.length - 1 ? 0 : c + 1))
  }

  const activeFrame = frames[current]

  return (
    <div className="flex flex-col gap-2">
      {/* 메인 프레임 뷰어 — 세로형 9:12 비율 */}
      <div className="relative aspect-[9/12] overflow-hidden rounded-lg bg-muted">
        {activeFrame.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={activeFrame.imageUrl}
            alt={activeFrame.label}
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
              <span className="text-sm font-medium text-foreground/70">
                {activeFrame.label}
              </span>
            </div>
          </>
        )}

        {/* 타임스탬프 배지 */}
        {activeFrame.timestamp !== undefined && (
          <div className="absolute top-2 left-2 rounded bg-background/70 px-2 py-0.5 text-xs tabular-nums">
            {formatTimestamp(activeFrame.timestamp)}
          </div>
        )}

        {/* 이전/다음 버튼 */}
        <button
          onClick={prev}
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1 hover:bg-background/80"
          aria-label="이전 프레임"
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          onClick={next}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-1 hover:bg-background/80"
          aria-label="다음 프레임"
        >
          <ChevronRight className="size-4" />
        </button>

        {/* 카운터 */}
        <div className="absolute bottom-2 right-2 rounded bg-background/60 px-2 py-0.5 text-xs">
          {current + 1}/{frames.length}
        </div>
      </div>

      {/* 썸네일 스트립 */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {frames.map((frame, i) => (
          <button
            key={frame.id}
            onClick={() => setCurrent(i)}
            className={cn(
              "relative size-10 shrink-0 overflow-hidden rounded transition-all",
              i === current
                ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                : "opacity-50 hover:opacity-80",
            )}
            aria-label={`프레임 ${i + 1}`}
          >
            {frame.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={frame.imageUrl}
                alt={frame.label}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div
                className={cn("absolute inset-0 bg-gradient-to-br", frame.gradient)}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${String(s).padStart(2, "0")}`
}
