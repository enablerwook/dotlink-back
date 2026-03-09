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
import { Separator } from "@/components/ui/separator"
import { Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CreationSaveData } from "@/domains/synapse/types"

const STEP_META = [
  { key: "draft_script",  title: "스크립트 작성 (초안)" },
  { key: "content_type",  title: "콘텐츠 유형 정의" },
  { key: "hook_text",     title: "후킹 매력 요소 (대사)" },
  { key: "hook_visual",   title: "후킹 매력 요소 (영상)" },
  { key: "engagement",    title: "인게이지먼트 유도 장치" },
  { key: "caption",       title: "캡션 작성" },
  { key: "selling_point", title: "세일즈 포인트" },
  { key: "production",    title: "연출요소" },
  { key: "final_script",  title: "스크립트 (최종안)" },
]

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

export function CreationDetailModal({
  creation,
  open,
  onOpenChange,
}: {
  creation: CreationSaveData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!creation) return null

  const filledCount = STEP_META.filter(
    ({ key }) =>
      (creation.values[key] ?? "").trim().length > 0 ||
      (creation.droppedFrames[key]?.length ?? 0) > 0,
  ).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl p-0" showCloseButton>
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-lg">{creation.title || "기획안 상세"}</DialogTitle>
            <Badge variant="outline" className="border-primary/30 text-primary">
              <Zap className="mr-1 size-3" />
              {filledCount}/9
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            {formatDate(creation.savedAt)} 저장됨
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(85vh-6rem)]">
          <div className="flex flex-col gap-5 px-6 pb-6">
            {STEP_META.map(({ key, title }, i) => {
              const text = (creation.values[key] ?? "").trim()
              const frames = creation.droppedFrames[key] ?? []
              const hasContent = text.length > 0 || frames.length > 0

              return (
                <div key={key}>
                  {i > 0 && <Separator className="mb-5" />}
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        hasContent
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {i + 1}
                    </span>
                    <h3 className="text-sm font-semibold">{title}</h3>
                  </div>

                  {text ? (
                    <p className="whitespace-pre-wrap pl-8 text-sm leading-relaxed text-muted-foreground">
                      {text}
                    </p>
                  ) : frames.length === 0 ? (
                    <p className="pl-8 text-sm italic text-muted-foreground/50">
                      작성된 내용이 없습니다
                    </p>
                  ) : null}

                  {frames.length > 0 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1 pl-8">
                      {frames.map((frame) => (
                        <div key={frame.id} className="shrink-0">
                          <div
                            className="h-20 overflow-hidden rounded-md"
                            style={{ aspectRatio: "9/12" }}
                            title={`${frame.sourceCard} - ${frame.label}`}
                          >
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
                          <p className="mt-0.5 text-center text-[8px] text-muted-foreground">
                            {frame.sourceCard}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
