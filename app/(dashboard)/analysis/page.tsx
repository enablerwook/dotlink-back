"use client"

import { useState } from "react"
import { UrlInput } from "@/components/analysis/url-input"
import { AnalysisResults } from "@/components/analysis/analysis-results"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FolderPlus, Check, AlertCircle } from "lucide-react"
import type { ContentCard, Platform } from "@/lib/types"
import type { AnalysisResponse } from "@/domains/analysis/analysis-service"

// API 응답을 UI의 ContentCard 형식으로 변환
function toContentCard(res: AnalysisResponse): ContentCard {
  return {
    id: res.id,
    title: res.title,
    platform: res.platform,
    url: res.url,
    thumbnailGradient: "from-blue-600 to-violet-600",
    dateAnalyzed: res.createdAt,
    frames: res.frames,
    analysis: res.analysis,
    tags: res.tags,
  }
}

export default function AnalysisPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ContentCard | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAnalyze(url: string, _platform: Platform) {
    setIsLoading(true)
    setResult(null)
    setAnalysisId(null)
    setIsSaved(false)
    setError(null)

    try {
      const res = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "분석 중 오류가 발생했습니다.")
        return
      }

      const card = toContentCard(data as AnalysisResponse)
      setResult(card)
      setAnalysisId(data.id)
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveToLibrary() {
    if (!analysisId) return
    setIsSaving(true)

    try {
      const res = await fetch("/api/library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId }),
      })

      if (res.ok) {
        setIsSaved(true)
      } else {
        const data = await res.json()
        setError(data.error ?? "저장 중 오류가 발생했습니다.")
      }
    } catch {
      setError("저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">DNA 분석</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          숏폼 콘텐츠의 URL을 입력하면 9가지 DNA 요소를 분석합니다.
        </p>
      </div>

      <UrlInput onAnalyze={handleAnalyze} isLoading={isLoading} />

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {isLoading && (
        <div className="mt-12 flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            AI가 콘텐츠 DNA를 분석하고 있습니다...
          </p>
          <p className="text-xs text-muted-foreground">
            분석에 15~30초가 소요될 수 있습니다.
          </p>
        </div>
      )}

      {result && !isLoading && (
        <div className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{result.title}</h2>
              <Badge variant="outline" className="capitalize">
                {result.platform}
              </Badge>
            </div>
            <Button
              variant={isSaved ? "secondary" : "outline"}
              size="sm"
              onClick={handleSaveToLibrary}
              disabled={isSaved || isSaving}
            >
              {isSaved ? (
                <>
                  <Check className="mr-1 size-4" />
                  저장됨
                </>
              ) : (
                <>
                  <FolderPlus className="mr-1 size-4" />
                  {isSaving ? "저장 중..." : "라이브러리에 저장"}
                </>
              )}
            </Button>
          </div>
          <AnalysisResults card={result} />
        </div>
      )}
    </div>
  )
}
