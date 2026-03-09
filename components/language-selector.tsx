"use client"

import { useState } from "react"
import { Globe, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useLocale, type LocaleCode } from "@/lib/locale-context"

interface LanguageItem {
  code: LocaleCode
  name: string
  region: string
}

const recommendedLanguages: LanguageItem[] = [
  { code: "en", name: "English",  region: "United States" },
  { code: "ko", name: "한국어",    region: "대한민국" },
]

const allLanguages: LanguageItem[] = [
  { code: "ko",    name: "한국어",          region: "대한민국" },
  { code: "en",    name: "English",        region: "United States" },
  { code: "ja",    name: "日本語",          region: "日本" },
  { code: "zh-CN", name: "简体中文",        region: "中国" },
  { code: "zh-TW", name: "繁體中文",        region: "台灣" },
  { code: "es",    name: "Español",        region: "España" },
  { code: "fr",    name: "Français",       region: "France" },
  { code: "de",    name: "Deutsch",        region: "Deutschland" },
  { code: "it",    name: "Italiano",       region: "Italia" },
  { code: "pt",    name: "Português",      region: "Brasil" },
  { code: "ru",    name: "Русский",        region: "Россия" },
  { code: "ar",    name: "العربية",        region: "العالم" },
  { code: "hi",    name: "हिन्दी",          region: "भारत" },
  { code: "th",    name: "ไทย",            region: "ประเทศไทย" },
  { code: "vi",    name: "Tiếng Việt",     region: "Việt Nam" },
  { code: "tr",    name: "Türkçe",         region: "Türkiye" },
  { code: "nl",    name: "Nederlands",     region: "Nederland" },
  { code: "pl",    name: "Polski",         region: "Polska" },
  { code: "sv",    name: "Svenska",        region: "Sverige" },
  { code: "id",    name: "Bahasa Indonesia", region: "Indonesia" },
]

export function LanguageSelector() {
  const { locale, setLocale, t, autoTranslate, setAutoTranslate } = useLocale()
  const [open, setOpen] = useState(false)

  const handleSelect = (code: LocaleCode) => {
    setLocale(code)
    setOpen(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
        aria-label="언어 선택"
      >
        <Globe className="size-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-3xl"
        >
          <DialogHeader className="flex flex-row items-center gap-2 border-b px-6 py-4">
            <DialogDescription className="sr-only">
              Select your preferred language and region
            </DialogDescription>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0"
              onClick={() => setOpen(false)}
            >
              <span className="text-lg leading-none">&times;</span>
              <span className="sr-only">Close</span>
            </Button>
            <DialogTitle className="text-base font-semibold">
              {t.langModalChoose}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1">
            <div className="px-6 py-5">
              {/* 번역 자동 전환 토글 */}
              <div className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Languages className="size-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t.langModalTranslation}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.langModalTranslationDesc}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={autoTranslate}
                  onCheckedChange={setAutoTranslate}
                  aria-label="번역 토글"
                />
              </div>

              {/* 추천 언어 */}
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-foreground">
                  {t.langModalRecommended}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {recommendedLanguages.map((lang) => (
                    <button
                      key={`rec-${lang.code}`}
                      onClick={() => handleSelect(lang.code)}
                      className={cn(
                        "rounded-lg border px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-accent",
                        locale === lang.code ? "border-primary bg-accent" : "border-border/60",
                      )}
                    >
                      <p className="text-sm font-medium text-foreground">{lang.name}</p>
                      <p className="text-xs text-muted-foreground">{lang.region}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Separator className="my-6" />

              {/* 전체 언어 */}
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t.langModalChoose}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {allLanguages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleSelect(lang.code)}
                      className={cn(
                        "rounded-lg border px-4 py-3 text-left transition-colors hover:border-primary/60 hover:bg-accent",
                        locale === lang.code ? "border-primary bg-accent" : "border-border/60",
                      )}
                    >
                      <p className="text-sm font-medium text-foreground">{lang.name}</p>
                      <p className="text-xs text-muted-foreground">{lang.region}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
