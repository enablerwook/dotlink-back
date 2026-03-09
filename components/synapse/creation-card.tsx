"use client"

import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ChevronDown, Download, Save, FolderOpen, Check, Zap, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { CreationPickerDialog } from "@/components/synapse/creation-picker-dialog"
import { FrameDropZone } from "@/components/synapse/frame-drop-zone"
import { useCreationCard, STEP_FIELDS } from "@/domains/synapse/hooks/use-creation-card"

export interface CreationCardProps {
  sourceCardAId?:  string
  sourceCardBId?:  string
}

export function CreationCard({ sourceCardAId, sourceCardBId }: CreationCardProps) {
  const {
    cardRef,
    steps, droppedFrames, openStep, filledCount,
    saveDialogOpen, loadDialogOpen, titleInput, saving, saved, saveError, isDraggingFrame,
    setSaveDialogOpen, setLoadDialogOpen, setTitleInput, setSaved,
    handleChange, toggleStep, handleDropFrame, handleRemoveFrame,
    handleSave, handleLoad, handleExport,
  } = useCreationCard(sourceCardAId, sourceCardBId)

  return (
    <>
      <div
        ref={cardRef}
        className="relative flex h-full flex-col overflow-hidden rounded-xl border border-primary/30 bg-card"
      >
        {/* 드래그 오버레이: 카드 어디에나 드롭 가능하게 전체 영역 커버 */}
        {isDraggingFrame && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-primary bg-background/80 backdrop-blur-sm pointer-events-none">
            <ImageIcon className="size-8 text-primary/50" />
            <div className="text-center">
              <p className="text-sm font-medium text-primary">프레임을 여기에 드롭하세요</p>
              <p className="mt-0.5 text-xs text-muted-foreground">후킹 매력 요소 (영상)에 추가됩니다</p>
            </div>
          </div>
        )}

        {/* 헤더 */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-primary">Creation Card</span>
            <Badge variant="outline" className="border-primary/30 text-primary text-[10px]">
              <Zap className="mr-1 size-3" />
              {filledCount}/9
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => { setSaveDialogOpen(true); setSaved(false) }}
              disabled={saving}
            >
              {saved ? (
                <><Check className="mr-1 size-3 text-green-500" />저장됨</>
              ) : (
                <><Save className="mr-1 size-3" />저장하기</>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setLoadDialogOpen(true)}
            >
              <FolderOpen className="mr-1 size-3" />불러오기
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleExport}>
              <Download className="mr-1 size-3" />내보내기
            </Button>
          </div>
        </div>

        {saveError && (
          <div className="border-b bg-destructive/10 px-4 py-2 text-xs text-destructive">
            {saveError}
          </div>
        )}

        {/* 아코디언 단계 목록 */}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide divide-y divide-border/50">
          {STEP_FIELDS.map(({ key, label, desc }, i) => {
            const isOpen = openStep === key
            const isFilled = steps[key].trim().length > 0 || (droppedFrames[key]?.length ?? 0) > 0
            const isHookVisual = key === "hook_visual"
            return (
              <div key={key}>
                <button
                  type="button"
                  onClick={() => toggleStep(key)}
                  className="flex w-full items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "inline-flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        isFilled ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium text-left">{label}</span>
                  </div>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                      isOpen && "rotate-180",
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-4 pb-4">
                    <p className="mb-2 text-xs text-muted-foreground/70">{desc}</p>
                    {isHookVisual ? (
                      <FrameDropZone
                        frames={droppedFrames["hook_visual"] ?? []}
                        onDrop={(frame) => handleDropFrame("hook_visual", frame)}
                        onRemove={(frameId) => handleRemoveFrame("hook_visual", frameId)}
                      />
                    ) : (
                      <Textarea
                        value={steps[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder="내용을 입력하세요..."
                        className="min-h-[80px] resize-none text-xs"
                        autoFocus
                      />
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 저장 Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">기획안 저장</DialogTitle>
            <DialogDescription className="text-xs">
              저장할 기획안의 제목을 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-1">
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave() }}
              placeholder="예: 카페 홍보 릴스 기획안"
              className="text-sm"
              autoFocus
            />
            {saveError && (
              <p className="text-xs text-destructive">{saveError}</p>
            )}
            <Button onClick={handleSave} disabled={saving || !titleInput.trim()} size="sm">
              {saving ? "저장 중..." : "저장"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 불러오기 Dialog */}
      <CreationPickerDialog
        open={loadDialogOpen}
        onOpenChange={setLoadDialogOpen}
        onSelect={handleLoad}
      />
    </>
  )
}
