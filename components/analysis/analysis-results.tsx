"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Gemini가 기존에 반환한 마크다운 기호를 일반 텍스트로 정규화
// **bold** → bold  |  *  item → • item
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")   // **굵은글씨** → 굵은글씨
    .replace(/^\*{1,2}\s+/gm, "• ")    // *  항목 또는 **  항목 → • 항목
    .replace(/^#{1,6}\s+/gm, "")       // ## 제목 → 제목
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FrameCarousel } from "./frame-carousel"
import { DifficultyMeter } from "./difficulty-meter"
import type { ContentCard } from "@/lib/types"

// 텍스트 기반 7개 분석 탭 정의
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

export function AnalysisResults({ card }: { card: ContentCard }) {
  const { analysis } = card

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

          return (
            <TabsContent key={item.key} value={item.key}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{item.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  {isEmpty ? (
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

        {/* 인게이지먼트 탭 — metrics(정량) + analysis(정성) */}
        <TabsContent value="engagement">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">인게이지먼트 분석</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* 정량 지표 */}
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

              {/* 정성 분석 */}
              {analysis.engagement.analysis ? (
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

        {/* 난이도 탭 */}
        <TabsContent value="difficulty">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">제작 난이도</CardTitle>
            </CardHeader>
            <CardContent>
              <DifficultyMeter difficulty={analysis.difficulty} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
