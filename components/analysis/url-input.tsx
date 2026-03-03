"use client"

import { useState } from "react"
import { Clipboard, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Platform } from "@/lib/types"

const platforms: { value: Platform; label: string; disabled?: boolean }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok", disabled: true },
  { value: "youtube", label: "YouTube", disabled: true },
]

export function UrlInput({
  onAnalyze,
  isLoading,
}: {
  onAnalyze: (url: string, platform: Platform) => void
  isLoading: boolean
}) {
  const [url, setUrl] = useState("")
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("instagram")

  function detectPlatform(value: string): Platform {
    // TikTok/YouTube는 아직 미지원 → 항상 instagram으로 고정
    if (value.includes("tiktok.com")) return "instagram"
    if (value.includes("youtube.com") || value.includes("youtu.be")) return "instagram"
    return "instagram"
  }

  function handleUrlChange(value: string) {
    setUrl(value)
    setSelectedPlatform(detectPlatform(value))
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText()
      setUrl(text)
      setSelectedPlatform(detectPlatform(text))
    } catch {
      // clipboard access denied
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Input
            placeholder="숏폼 콘텐츠 URL을 붙여넣기 하세요..."
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={handlePaste}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="붙여넣기"
          >
            <Clipboard className="size-4" />
          </button>
        </div>
        <Button
          size="lg"
          onClick={() => onAnalyze(url, selectedPlatform)}
          disabled={!url.trim() || isLoading}
          className="h-11 shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              분석 중...
            </>
          ) : (
            "분석 시작"
          )}
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">플랫폼:</span>
        {platforms.map((p) => (
          <Badge
            key={p.value}
            variant={selectedPlatform === p.value ? "default" : "outline"}
            className={p.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}
            title={p.disabled ? "준비 중" : undefined}
            onClick={() => !p.disabled && setSelectedPlatform(p.value)}
          >
            {p.label}
            {p.disabled && <span className="ml-1 text-[10px]">준비중</span>}
          </Badge>
        ))}
      </div>
    </div>
  )
}
