"use client"

/**
 * Locale Context
 *
 * 단일 책임: 사용자 언어 설정 상태를 관리하고 하위 컴포넌트에 제공합니다.
 * 타입 정의 → lib/i18n/types.ts
 * 번역 데이터 → lib/i18n/translations.ts
 * 서버 사이드 헬퍼 → lib/locale-server.ts
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import type { LocaleCode, TranslationStrings } from "@/lib/i18n/types"
import { translations } from "@/lib/i18n/translations"

export type { LocaleCode }
export type { TranslationStrings }

interface LocaleContextType {
  locale: LocaleCode
  setLocale: (code: LocaleCode) => void
  t: TranslationStrings
  autoTranslate: boolean
  setAutoTranslate: (v: boolean) => void
}

const LocaleContext = createContext<LocaleContextType | null>(null)

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider")
  return ctx
}

// ── Cookie helpers (client-side only) ────────────────────────────────────────

const LOCALE_COOKIE_KEY = "dotlink-locale"
const AUTO_TRANSLATE_COOKIE_KEY = "dotlink-auto-translate"

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

// ── Provider ─────────────────────────────────────────────────────────────────

interface LocaleProviderProps {
  children: ReactNode
  initialLocale?: LocaleCode
  initialAutoTranslate?: boolean
}

export function LocaleProvider({
  children,
  initialLocale = "ko",
  initialAutoTranslate = true,
}: LocaleProviderProps) {
  const [locale, setLocaleState] = useState<LocaleCode>(initialLocale)
  const [autoTranslate, setAutoTranslateState] = useState(initialAutoTranslate)

  // 기존 localStorage 값을 cookie로 1회 마이그레이션 (이전 버전 사용자 대응)
  useEffect(() => {
    try {
      const lsLocale = window.localStorage.getItem("dotlink-locale")
      if (lsLocale && lsLocale in translations) {
        const cookieVal = getCookie(LOCALE_COOKIE_KEY)
        if (!cookieVal || cookieVal === "ko") {
          setCookie(LOCALE_COOKIE_KEY, lsLocale)
          setLocaleState(lsLocale as LocaleCode)
        }
        window.localStorage.removeItem("dotlink-locale")
      }
      const lsAT = window.localStorage.getItem("dotlink-auto-translate")
      if (lsAT !== null) {
        setCookie(AUTO_TRANSLATE_COOKIE_KEY, lsAT)
        setAutoTranslateState(lsAT === "true")
        window.localStorage.removeItem("dotlink-auto-translate")
      }
    } catch {
      // storage 접근 오류 무시
    }
  }, [])

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code)
    setCookie(LOCALE_COOKIE_KEY, code)
  }, [])

  const setAutoTranslate = useCallback((v: boolean) => {
    setAutoTranslateState(v)
    setCookie(AUTO_TRANSLATE_COOKIE_KEY, String(v))
  }, [])

  return (
    <LocaleContext.Provider
      value={{ locale, setLocale, t: translations[locale], autoTranslate, setAutoTranslate }}
    >
      {children}
    </LocaleContext.Provider>
  )
}
