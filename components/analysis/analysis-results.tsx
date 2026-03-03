"use client"

import { useState } from "react"
import { Pencil, Check, X } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { FrameCarousel } from "./frame-carousel"
import { DifficultyMeter } from "./difficulty-meter"
import type { AnalysisResult, ContentCard, DifficultyRating } from "@/lib/types"

// Gemini가 기존에 반환한 마크다운 기호를 일반 텍스트로 정규화
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **굵은글씨** → 굵은글씨
    .replace(/^\*{1,2}\s+/gm, "• ")    // *  항목 → • 항목
    .replace(/^#{1,6}\s+/gm, "")       // ## 제목 → 제목
}

// 텍스트 기반 7개 탭 정의
const textTabs = [
  { key: "hook_analysis",   label: "3초 후킹 영상",   short: "후킹 영상" },
  { key: "hook_text",       label: "3초 후킹 텍스트",  short: "후킹 텍스트" },
  { key: "full_script",     label: "전체 대본",        short: "대본" },
  { key: "caption",         label: "캡션 & 해시태그",  short: "캡션" },
  { key: "production_note", label: "촬영/편집 스타일", short: "연출" },
  { key: "content_type",    label: "콘텐츠 유형",      short: "유형" },
  { key: "selling_point",   label: "세일즈/소구점",    short: "소구점" },
] as const

type TextTabKey = typeof textTabs[number]["key"]

const difficultyLabels: { key: keyof DifficultyRating; label: string }[] = [
  { key: "planning", label: "기획" },
  { key: "filming",  label: "촬영" },
  { key: "editing",  label: "편집" },
]

export function AnalysisResults({
  card,
  onUpdate,
}: {
  card: ContentCard
  onUpdate?: (analysis: AnalysisResult) => void
}) {
  const { analysis } = card

  const [editingKey, setEditingKey] = useState<TextTabKey | "engagement" | "difficulty" | null>(null)
  const [editValue, setEditValue] = useState("")
  const [editDifficulty, setEditDifficulty] = useState<DifficultyRating>({
    planning: 1,
    filming: 1,
    editing: 1,
  })

  function startTextEdit(key: TextTabKey | "engagement") {
    const current =
      key === "engagement"
        ? analysis.engagement.analysis
        : analysis[key]
    setEditingKey(key)
    setEditValue(stripMarkdown(current ?? ""))
  }

  function saveTextEdit(key: TextTabKey | "engagement") {
    if (onUpdate) {
      if (key === "engagement") {
        onUpdate({ ...analysis, engagement: { ...analysis.engagement, analysis: editValue } })
      } else {
        onUpdate({ ...analysis, [key]: editValue })
      }
    }
    setEditingKey(null)
  }

  function startDifficultyEdit() {
    setEditingKey("difficulty")
    setEditDifficulty({ ...analysis.difficulty })
  }

  function saveDifficultyEdit() {
    if (onUpdate) {
      onUpdate({ ...analysis, difficulty: editDifficulty })
    }
    setEditingKey(null)
  }

  function cancelEdit() {
    setEditingKey(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Frame carousel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">프레임 분석</CardTitle>
        </CardHeader>
        <CardContent>
          <FrameCarousel frames={card.frames} />
        </CardContent>
      </Card>

      {/* Analysis tabs */}
      <Tabs defaultValue="hook_analysis" className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="w-full justify-start">
            {textTabs.map((item) => (
              <TabsTrigger key={item.key} value={item.key} className="shrink-0 text-xs">
                {item.short}
              </TabsTrigger>
            ))}
            <TabsTrigger value="engagement" className="shrink-0 text-xs">
              인게이지먼트
            </TabsTrigger>
            <TabsTrigger value="difficulty" className="shrink-0 text-xs">
              난이도
            </TabsTrigger>
          </TabsList>
        </ScrollArea>

        {/* 텍스트 기반 탭 */}
        {textTabs.map((item) => {
          const raw = analysis[item.key as TextTabKey] as string
          const value = raw ? stripMarkdown(raw) : ""
          const isEmpty = !value
          const isEditing = editingKey === item.key

          return (
            <TabsContent key={item.key} value={item.key}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-base">{item.label}</CardTitle>
                  {onUpdate && !isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startTextEdit(item.key)}
                      className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-3.5" />
                      수정
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {isEditing ? (
                    <div className="flex flex-col gap-3">
                      <Textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        rows={6}
                        className="text-sm leading-relaxed"
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                          className="h-8 gap-1 text-xs"
                        >
                          <X className="size-3.5" />
                          취소
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveTextEdit(item.key)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Check className="size-3.5" />
                          저장
                        </Button>
                      </div>
                    </div>
                  ) : isEmpty ? (
                    <p className="text-sm text-muted-foreground/50 italic">
                      {item.key === "full_script"
                        ? "음성이 없거나 추출에 실패하여 대본을 표시할 수 없습니다."
                        : item.key === "hook_text"
                        ? "첫 5초 내 발화 텍스트가 없거나 음성 추출에 실패했습니다."
                        : "분석 데이터가 없습니다."}
                    </p>
                  ) : (
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                      {value}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        })}

        {/* 인게이지먼트 탭 — metrics(정량) + analysis(정성, 편집 가능) */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">인게이지먼트 분석</CardTitle>
              {onUpdate && editingKey !== "engagement" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startTextEdit("engagement")}
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                  수정
                </Button>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* 정량 지표 — 항상 표시 */}
              <div className="grid grid-cols-3 gap-3">
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

              {/* 정성 분석 — 편집 가능 */}
              {editingKey === "engagement" ? (
                <div className="flex flex-col gap-3">
                  <Textarea
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows={6}
                    className="text-sm leading-relaxed"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                      className="h-8 gap-1 text-xs"
                    >
                      <X className="size-3.5" />
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => saveTextEdit("engagement")}
                      className="h-8 gap-1 text-xs"
                    >
                      <Check className="size-3.5" />
                      저장
                    </Button>
                  </div>
                </div>
              ) : analysis.engagement.analysis ? (
                <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                  {stripMarkdown(analysis.engagement.analysis)}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/50 italic">
                  참여도 분석 데이터가 없습니다.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 난이도 탭 — 슬라이더로 편집 */}
        <TabsContent value="difficulty">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">제작 난이도</CardTitle>
              {onUpdate && editingKey !== "difficulty" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startDifficultyEdit}
                  className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="size-3.5" />
                  수정
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {editingKey === "difficulty" ? (
                <div className="flex flex-col gap-5">
                  {difficultyLabels.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-10 shrink-0 text-sm text-muted-foreground">{label}</span>
                      <Slider
                        value={[editDifficulty[key]]}
                        onValueChange={([v]) =>
                          setEditDifficulty((prev) => ({ ...prev, [key]: v }))
                        }
                        min={1}
                        max={5}
                        step={1}
                        className="flex-1"
                      />
                      <span className="w-8 text-right text-sm font-medium">
                        {editDifficulty[key]}/5
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEdit}
                      className="h-8 gap-1 text-xs"
                    >
                      <X className="size-3.5" />
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={saveDifficultyEdit}
                      className="h-8 gap-1 text-xs"
                    >
                      <Check className="size-3.5" />
                      저장
                    </Button>
                  </div>
                </div>
              ) : (
                <DifficultyMeter difficulty={analysis.difficulty} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
