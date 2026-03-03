"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronUp } from "lucide-react"
import { mockFeatureRequests } from "@/lib/mock-data"
import type { FeatureRequest } from "@/lib/types"

const priorityLabels: Record<string, string> = {
  high: "높음",
  medium: "보통",
  low: "낮음",
}

const priorityColors: Record<string, string> = {
  high: "bg-red-500/20 text-red-400",
  medium: "bg-amber-500/20 text-amber-400",
  low: "bg-emerald-500/20 text-emerald-400",
}

export default function FeatureRequestPage() {
  const [requests, setRequests] = useState<FeatureRequest[]>(mockFeatureRequests)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [priority, setPriority] = useState("medium")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !description.trim() || !category) return

    const newRequest: FeatureRequest = {
      id: `fr-${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      priority: priority as FeatureRequest["priority"],
      upvotes: 0,
      author: "나",
      dateSubmitted: new Date().toISOString().split("T")[0],
      hasUpvoted: false,
    }
    setRequests((prev) => [newRequest, ...prev])
    setTitle("")
    setDescription("")
    setCategory("")
    setPriority("medium")
  }

  function handleUpvote(id: string) {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              upvotes: r.hasUpvoted ? r.upvotes - 1 : r.upvotes + 1,
              hasUpvoted: !r.hasUpvoted,
            }
          : r,
      ),
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">기능 요청</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          DotLink에 추가되었으면 하는 기능을 제안해주세요.
        </p>
      </div>

      {/* Form */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-base">새로운 기능 제안하기</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="req-title" className="mb-1.5 text-sm">
                제목
              </Label>
              <Input
                id="req-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="원하는 기능의 제목을 입력하세요"
              />
            </div>
            <div>
              <Label htmlFor="req-desc" className="mb-1.5 text-sm">
                설명
              </Label>
              <Textarea
                id="req-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="기능에 대해 자세히 설명해주세요"
                className="min-h-[100px]"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-1.5 text-sm">카테고리</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI 기능">AI 기능</SelectItem>
                    <SelectItem value="분석">분석</SelectItem>
                    <SelectItem value="협업">협업</SelectItem>
                    <SelectItem value="유틸리티">유틸리티</SelectItem>
                    <SelectItem value="UI/UX">UI/UX</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 text-sm">우선순위</Label>
                <RadioGroup value={priority} onValueChange={setPriority} className="flex gap-4 pt-2">
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="low" id="p-low" />
                    <Label htmlFor="p-low" className="text-sm">낮음</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="medium" id="p-med" />
                    <Label htmlFor="p-med" className="text-sm">보통</Label>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <RadioGroupItem value="high" id="p-high" />
                    <Label htmlFor="p-high" className="text-sm">높음</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            <Button type="submit" className="self-end">제출하기</Button>
          </form>
        </CardContent>
      </Card>

      <Separator className="mb-8" />

      {/* Request list */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">제안된 기능 ({requests.length})</h2>
        {requests
          .sort((a, b) => b.upvotes - a.upvotes)
          .map((req) => (
            <Card key={req.id} className="border-border/50">
              <CardContent className="flex items-start gap-4 py-4">
                {/* Upvote */}
                <button
                  onClick={() => handleUpvote(req.id)}
                  className={`flex flex-col items-center gap-0.5 rounded-lg border px-2.5 py-1.5 transition-colors ${
                    req.hasUpvoted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50"
                  }`}
                  aria-label={`추천 ${req.upvotes}`}
                >
                  <ChevronUp className="size-4" />
                  <span className="text-xs font-medium">{req.upvotes}</span>
                </button>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{req.title}</h3>
                    <Badge variant="outline" className="text-[10px]">
                      {req.category}
                    </Badge>
                    <Badge
                      className={`border-0 text-[10px] ${priorityColors[req.priority]}`}
                    >
                      {priorityLabels[req.priority]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {req.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{req.author}</span>
                    <span>-</span>
                    <span>{req.dateSubmitted}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    </div>
  )
}
