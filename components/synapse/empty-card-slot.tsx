"use client"

import { Plus } from "lucide-react"
import { useLocale } from "@/lib/locale-context"

export function EmptyCardSlot({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  const { t } = useLocale()

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-dashed border-border/60 bg-card/50">
      <div className="flex items-center gap-2 border-b border-dashed border-border/40 px-4 py-3">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      </div>

      <button
        type="button"
        onClick={onClick}
        className="group flex flex-1 flex-col items-center justify-center gap-3 transition-colors hover:bg-accent/30"
      >
        <div className="flex size-14 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30 transition-all group-hover:border-primary group-hover:bg-primary/10">
          <Plus className="size-6 text-muted-foreground/50 transition-colors group-hover:text-primary" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
            {t.synapseEmptySlot}
          </span>
          <span className="text-xs text-muted-foreground/60">
            {t.synapsePickFromLibrary}
          </span>
        </div>
      </button>
    </div>
  )
}
