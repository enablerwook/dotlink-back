"use client"

import { useState } from "react"
import { ImageIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DroppedFrame } from "@/domains/synapse/types"
import { getActiveDragFrame } from "@/domains/synapse/drag-state"

interface FrameDropZoneProps {
  frames: DroppedFrame[]
  onDrop: (frame: DroppedFrame) => void
  onRemove: (frameId: string) => void
}

export function FrameDropZone({ frames, onDrop, onRemove }: FrameDropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  // Root Cause 4 fix: ignore false dragLeave events caused by entering child elements
  function handleDragLeave(e: React.DragEvent) {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const frame = getActiveDragFrame()
    if (!frame) return
    onDrop(frame)
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "mt-2 rounded-lg border-2 border-dashed p-3 transition-colors",
        isDragOver ? "border-primary bg-primary/5" : "border-border/50 bg-muted/20",
      )}
    >
      {frames.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-2 text-center">
          <ImageIcon className="size-5 text-muted-foreground/40" />
          <p className="text-[10px] text-muted-foreground/60">
            Card A/B 썸네일을 드래그하여 추가하세요
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {frames.map((frame) => (
            <div key={frame.id} className="relative">
              <div className="h-16 overflow-hidden rounded" style={{ aspectRatio: "9/12" }}>
                {frame.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={frame.imageUrl}
                    alt={frame.label}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className={cn("h-full w-full bg-gradient-to-br", frame.gradient)} />
                )}
              </div>
              <button
                type="button"
                onClick={() => onRemove(frame.id)}
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
                aria-label="프레임 제거"
              >
                <X className="size-2.5" />
              </button>
              <p className="mt-0.5 text-center text-[8px] text-muted-foreground">
                {frame.sourceCard}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
