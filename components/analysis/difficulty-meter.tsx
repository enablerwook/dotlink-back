import { Progress } from "@/components/ui/progress"
import type { DifficultyRating } from "@/lib/types"

const labels: { key: keyof DifficultyRating; label: string }[] = [
  { key: "planning", label: "기획" },
  { key: "filming", label: "촬영" },
  { key: "editing", label: "편집" },
]

export function DifficultyMeter({ difficulty }: { difficulty: DifficultyRating }) {
  return (
    <div className="flex flex-col gap-3">
      {labels.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="w-10 shrink-0 text-sm text-muted-foreground">{label}</span>
          <Progress value={difficulty[key] * 20} className="h-2 flex-1" />
          <span className="w-8 text-right text-sm font-medium">{difficulty[key]}/5</span>
        </div>
      ))}
    </div>
  )
}
