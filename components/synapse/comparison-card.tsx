import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
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
          {sections.map(({ key, label: sLabel }) => (
            <div key={key}>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{sLabel}</p>
              <p className="text-xs leading-relaxed">{card.analysis[key]}</p>
            </div>
          ))}
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
