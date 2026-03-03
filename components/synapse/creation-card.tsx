"use client"

import { useState, useEffect } from "react"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Download, Save, Check } from "lucide-react"
import type { CompareResult } from "@/infrastructure/ai/gemini-compare"

const fields = [
  { key: "script", label: "전체 스크립트(대본)" },
  { key: "contentType", label: "콘텐츠 유형 분류" },
  { key: "hookVisual", label: "3초 후킹 영상 요소" },
  { key: "hookText", label: "3초 후킹 텍스트 요소" },
  { key: "caption", label: "캡션 내용" },
  { key: "storyboard", label: "스토리보드/연출" },
  { key: "engagement", label: "인게이지먼트 유도 요소" },
  { key: "salesPoints", label: "세일즈/소구점" },
  { key: "difficulty", label: "제작 난이도 메모" },
] as const

type FieldKey = (typeof fields)[number]["key"]

export interface CreationCardProps {
  aiSuggestions?: CompareResult | null
  cardAId?: string
  cardBId?: string
  aiInsights?: string
  differentiation?: string
  keywords?: string[]
}

export function CreationCard({
  aiSuggestions,
  cardAId,
  cardBId,
  aiInsights,
  differentiation,
  keywords,
}: CreationCardProps) {
  const [values, setValues] = useState<Record<FieldKey, string>>(
    Object.fromEntries(fields.map((f) => [f.key, ""])) as Record<FieldKey, string>,
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // AI 제안이 들어오면 필드에 자동 채우기
  useEffect(() => {
    if (!aiSuggestions) return
    setValues({
      script: aiSuggestions.script,
      contentType: aiSuggestions.contentType,
      hookVisual: aiSuggestions.hookVisual,
      hookText: aiSuggestions.hookText,
      caption: aiSuggestions.caption,
      storyboard: aiSuggestions.storyboard,
      engagement: aiSuggestions.engagement,
      salesPoints: aiSuggestions.salesPoints,
      difficulty: aiSuggestions.difficulty,
    })
    setSaved(false)
  }, [aiSuggestions])

  function handleChange(key: FieldKey, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch("/api/synapse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardAId,
          cardBId,
          hookingPoint: `${values.hookVisual}\n\n${values.hookText}`,
          contentStructure: `${values.script}\n\n${values.storyboard}`,
          differentiation: differentiation ?? "",
          keywords: keywords ?? [],
          aiInsights: aiInsights ?? "",
          draft: JSON.stringify(values),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error ?? "저장에 실패했습니다.")
      } else {
        setSaved(true)
      }
    } catch {
      setSaveError("서버에 연결할 수 없습니다.")
    } finally {
      setSaving(false)
    }
  }

  function handleExport() {
    const lines = fields.map(
      ({ key, label }) => `## ${label}\n${values[key] || "(비어 있음)"}`,
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

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-primary/30 bg-card">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <span className="text-xs font-semibold text-primary">Creation Card</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleSave}
            disabled={saving || saved}
          >
            {saved ? (
              <>
                <Check className="mr-1 size-3 text-green-500" />
                저장됨
              </>
            ) : (
              <>
                <Save className="mr-1 size-3" />
                {saving ? "저장 중..." : "저장"}
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={handleExport}
          >
            <Download className="mr-1 size-3" />
            내보내기
          </Button>
        </div>
      </div>

      {saveError && (
        <div className="border-b bg-destructive/10 px-4 py-2 text-xs text-destructive">
          {saveError}
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {aiInsights && (
            <div className="rounded-lg bg-primary/5 p-3">
              <p className="mb-1 text-xs font-semibold text-primary">AI 인사이트</p>
              <p className="text-xs leading-relaxed text-muted-foreground">{aiInsights}</p>
            </div>
          )}
          {fields.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {label}
              </label>
              <Textarea
                value={values[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder={`${label}을(를) 작성하세요...`}
                className="min-h-[80px] resize-none text-xs"
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
