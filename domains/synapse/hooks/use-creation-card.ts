import { useState, useEffect, useRef } from "react"
import type { CreationSteps, DroppedFrame, CreationCard as CreationCardType } from "@/domains/synapse/types"
import { getActiveDragFrame, setActiveDragFrame } from "@/domains/synapse/drag-state"

// Exported so the rendering component can use it for the accordion
export const STEP_FIELDS: { key: keyof CreationSteps; label: string; desc: string }[] = [
  { key: "draft_script",  label: "스크립트 작성 (초안)",       desc: "레퍼런스를 보고 떠오르는 스크립트를 자유롭게 적어보세요. 아래 항목들을 보며 초안을 다듬어가면 합니다." },
  { key: "content_type",  label: "콘텐츠 유형 정의",           desc: "브이로그, 튜토리얼, 리뷰 등 콘텐츠 형식을 정하세요." },
  { key: "hook_text",     label: "후킹 매력 요소 (대사)",       desc: "첫 3초 시청자를 사로잡는 대사를 작성하세요." },
  { key: "hook_visual",   label: "후킹 매력 요소 (영상)",       desc: "첫 3초 시청자를 사로잡는 장면/비주얼을 설명하세요. Card A/B의 썸네일을 드래그하여 레퍼런스 프레임을 추가할 수 있습니다." },
  { key: "engagement",    label: "인게이지먼트 유도 장치",      desc: "댓글·공유·저장을 유도하는 장치를 설계하세요." },
  { key: "caption",       label: "캡션 작성",                   desc: "업로드할 캡션과 해시태그를 작성하세요." },
  { key: "selling_point", label: "세일즈 포인트",               desc: "이 영상의 핵심 소구점을 작성하세요." },
  { key: "production",    label: "연출요소",                    desc: "BGM, 자막, 전환효과 등 연출 계획을 적으세요." },
  { key: "final_script",  label: "스크립트 (최종안)",           desc: "완성된 최종 대본을 작성하세요." },
]

const EMPTY_STEPS: CreationSteps = {
  draft_script:  "",
  content_type:  "",
  hook_text:     "",
  hook_visual:   "",
  engagement:    "",
  caption:       "",
  selling_point: "",
  production:    "",
  final_script:  "",
}

const FRAME_MIME = "application/dotlink-frame"

export function useCreationCard(
  sourceCardAId?: string,
  sourceCardBId?: string,
) {
  const [steps, setSteps] = useState<CreationSteps>(EMPTY_STEPS)
  const [droppedFrames, setDroppedFrames] = useState<Record<string, DroppedFrame[]>>({})
  const [openStep, setOpenStep] = useState<keyof CreationSteps | null>("draft_script")
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [titleInput, setTitleInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDraggingFrame, setIsDraggingFrame] = useState(false)

  // ref attached to the outer card div — used for native drag event listeners
  const cardRef = useRef<HTMLDivElement>(null)

  // Native drag listeners bypass React's event delegation so e.preventDefault()
  // reaches the browser's native drag engine at the correct point in the event chain.
  // State setters (setX) are stable references — safe to use inside [] deps effect.
  useEffect(() => {
    const card = cardRef.current
    if (!card) return

    function onDragEnter(e: DragEvent) {
      if (e.dataTransfer?.types.includes(FRAME_MIME)) {
        setIsDraggingFrame(true)
      }
    }

    function onDragLeave(e: DragEvent) {
      if (card && !card.contains(e.relatedTarget as Node)) {
        setIsDraggingFrame(false)
      }
    }

    function onDragOver(e: DragEvent) {
      if (e.dataTransfer?.types.includes(FRAME_MIME)) {
        e.preventDefault()
        if (e.dataTransfer) e.dataTransfer.dropEffect = "copy"
      }
    }

    function onDrop(e: DragEvent) {
      e.preventDefault()
      setIsDraggingFrame(false)
      // dataTransfer.getData()는 Chrome native 리스너에서 빈 문자열 반환 (보안 정책)
      // → 모듈 변수에서 직접 읽어 우회
      const frame = getActiveDragFrame()
      setActiveDragFrame(null)
      if (!frame) return
      setDroppedFrames((prev) => {
        const existing = prev["hook_visual"] ?? []
        if (existing.some((f) => f.id === frame.id)) return prev
        return { ...prev, hook_visual: [...existing, frame] }
      })
      setOpenStep("hook_visual")
      setSaved(false)
    }

    // dragend fires on the SOURCE element — listen on document to clear overlay on cancelled drags
    function onDragEnd() {
      setIsDraggingFrame(false)
      setActiveDragFrame(null)
    }

    card.addEventListener("dragenter", onDragEnter)
    card.addEventListener("dragleave", onDragLeave)
    card.addEventListener("dragover",  onDragOver)
    card.addEventListener("drop",      onDrop)
    document.addEventListener("dragend", onDragEnd)

    return () => {
      card.removeEventListener("dragenter", onDragEnter)
      card.removeEventListener("dragleave", onDragLeave)
      card.removeEventListener("dragover",  onDragOver)
      card.removeEventListener("drop",      onDrop)
      document.removeEventListener("dragend", onDragEnd)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filledCount = Object.values(steps).filter((v) => v.trim().length > 0).length

  function handleChange(key: keyof CreationSteps, value: string) {
    setSteps((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function toggleStep(key: keyof CreationSteps) {
    setOpenStep((prev) => (prev === key ? null : key))
  }

  function handleDropFrame(key: string, frame: DroppedFrame) {
    setDroppedFrames((prev) => {
      const existing = prev[key] ?? []
      if (existing.some((f) => f.id === frame.id)) return prev
      return { ...prev, [key]: [...existing, frame] }
    })
    setSaved(false)
  }

  function handleRemoveFrame(key: string, frameId: string) {
    setDroppedFrames((prev) => ({
      ...prev,
      [key]: (prev[key] ?? []).filter((f) => f.id !== frameId),
    }))
    setSaved(false)
  }

  async function handleSave() {
    if (!titleInput.trim()) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/synapse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:         titleInput.trim(),
          sourceCardAId: sourceCardAId ?? null,
          sourceCardBId: sourceCardBId ?? null,
          steps,
          droppedFrames,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error ?? "저장에 실패했습니다.")
      } else {
        setSaved(true)
        setSaveDialogOpen(false)
        setTitleInput("")
      }
    } catch {
      setSaveError("서버에 연결할 수 없습니다.")
    } finally {
      setSaving(false)
    }
  }

  function handleLoad(card: CreationCardType) {
    setSteps({ ...EMPTY_STEPS, ...card.steps })
    setDroppedFrames(card.droppedFrames ?? {})
    setSaved(false)
  }

  function handleExport() {
    const lines = STEP_FIELDS.map(
      ({ label, key }) => `## ${label}\n${steps[key] || "(비어 있음)"}`,
    )
    const text = ["# Creation Card", "", ...lines].join("\n\n")
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "creation-card.txt"
    a.click()
    URL.revokeObjectURL(url)
  }

  return {
    // Ref
    cardRef,
    // State
    steps,
    droppedFrames,
    openStep,
    filledCount,
    saveDialogOpen,
    loadDialogOpen,
    titleInput,
    saving,
    saved,
    saveError,
    isDraggingFrame,
    // Setters (used directly in JSX for dialogs / inputs)
    setSaveDialogOpen,
    setLoadDialogOpen,
    setTitleInput,
    setSaved,
    // Handlers
    handleChange,
    toggleStep,
    handleDropFrame,
    handleRemoveFrame,
    handleSave,
    handleLoad,
    handleExport,
  }
}
