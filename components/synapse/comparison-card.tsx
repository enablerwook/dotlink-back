import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DifficultyMeter } from "@/components/analysis/difficulty-meter"
import type { ContentCard } from "@/lib/types"

// AnalysisResult의 string 필드만 표시 (현재 타입명으로 수정)
const sections: { key: string; label: string }[] = [
  { key: "hook_analysis",   label: "3초 후킹 영상" },
  { key: "hook_text",       label: "3초 후킹 텍스트" },
  { key: "full_script",     label: "전체 대본" },
  { key: "caption",         label: "캡션 & 해시태그" },
  { key: "production_note", label: "촬영/편집 스타일" },
  { key: "content_type",    label: "콘텐츠 유형" },
  { key: "selling_point",   label: "세일즈/소구점" },
]

export function ComparisonCard({
  card,
  label,
}: {
  card: ContentCard
  label: string
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/50 bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary">{label}</span>
          <Badge variant="outline" className="text-[10px] capitalize">
            {card.platform}
          </Badge>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          <h3 className="text-sm font-semibold">{card.title}</h3>
          {sections.map(({ key, label: sLabel }) => {
            const value = card.analysis[key as keyof typeof card.analysis]
            const text = typeof value === "string" ? value : ""
            return (
              <div key={key}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{sLabel}</p>
                {text ? (
                  <p className="text-xs leading-relaxed">{text}</p>
                ) : (
                  <p className="text-xs text-muted-foreground/50 italic">데이터 없음</p>
                )}
              </div>
            )
          })}

          {/* 인게이지먼트 지표 */}
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">인게이지먼트</p>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[
                { label: "조회수", value: card.analysis.engagement.metrics.views },
                { label: "좋아요", value: card.analysis.engagement.metrics.likes },
                { label: "댓글",   value: card.analysis.engagement.metrics.comments },
              ].map((m) => (
                <div
                  key={m.label}
                  className="flex flex-col items-center justify-center rounded-md border bg-muted/40 py-2"
                >
                  <span className="text-sm font-semibold tabular-nums">
                    {m.value.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
            {card.analysis.engagement.analysis && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {card.analysis.engagement.analysis}
              </p>
            )}
          </div>

          <Separator />
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">제작 난이도</p>
            <DifficultyMeter difficulty={card.analysis.difficulty} />
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
