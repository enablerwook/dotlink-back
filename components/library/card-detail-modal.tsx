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
import { FrameCarousel } from "@/components/analysis/frame-carousel"
import { DifficultyMeter } from "@/components/analysis/difficulty-meter"
import type { ContentCard } from "@/lib/types"

// Phase 9 텍스트 기반 분석 섹션
const textSections = [
  { key: "hook_analysis",   label: "3초 후킹 영상" },
  { key: "hook_text",       label: "3초 후킹 텍스트 (첫 5초 발화)" },
  { key: "full_script",     label: "전체 대본" },
  { key: "caption",         label: "캡션 & 해시태그" },
  { key: "production_note", label: "촬영/편집 스타일" },
  { key: "content_type",    label: "콘텐츠 유형" },
  { key: "selling_point",   label: "세일즈/소구점" },
] as const

type TextSectionKey = typeof textSections[number]["key"]

export function CardDetailModal({
  card,
  open,
  onOpenChange,
}: {
  card: ContentCard | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!card) return null

  const { analysis } = card

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
          <div className="flex flex-col gap-6 px-6 pb-6">
            <FrameCarousel frames={card.frames} />
            <Separator />

            {/* 텍스트 기반 분석 섹션 */}
            {textSections.map(({ key, label }) => {
              const value = analysis[key as TextSectionKey] as string
              return (
                <div key={key}>
                  <h3 className="mb-1.5 text-sm font-semibold">{label}</h3>
                  {value ? (
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {value}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic">
                      {key === "full_script"
                        ? "음성이 없거나 추출에 실패하여 대본을 표시할 수 없습니다."
                        : key === "hook_text"
                        ? "첫 5초 내 발화 텍스트가 없거나 음성 추출에 실패했습니다."
                        : "분석 데이터가 없습니다."}
                    </p>
                  )}
                </div>
              )
            })}

            <Separator />

            {/* 인게이지먼트 섹션 */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">인게이지먼트</h3>
              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: "조회수", value: analysis.engagement.metrics.views },
                  { label: "좋아요", value: analysis.engagement.metrics.likes },
                  { label: "댓글",   value: analysis.engagement.metrics.comments },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex flex-col items-center justify-center rounded-lg border bg-muted/40 py-3"
                  >
                    <span className="text-lg font-semibold tabular-nums">
                      {m.value.toLocaleString()}
                    </span>
                    <span className="text-xs text-muted-foreground">{m.label}</span>
                  </div>
                ))}
              </div>
              {analysis.engagement.analysis ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {analysis.engagement.analysis}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">
                  참여도 분석 데이터가 없습니다.
                </p>
              )}
            </div>

            <Separator />

            {/* 제작 난이도 */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">제작 난이도</h3>
              <DifficultyMeter difficulty={card.analysis.difficulty} />
            </div>

            {/* 태그 */}
            {card.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
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
