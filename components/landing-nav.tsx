"use client"

import Link from "next/link"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSelector } from "@/components/language-selector"
import { useLocale } from "@/lib/locale-context"

export function LandingNav() {
  const { t } = useLocale()

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">DotLink</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Language</span>
          <LanguageSelector />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">로그인</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">{t.landingNavTrial}</Link>
          </Button>
        </div>
      </div>
    </nav>
  )
}
