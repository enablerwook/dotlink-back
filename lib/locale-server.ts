/**
 * Locale 서버 사이드 헬퍼
 *
 * 단일 책임: Server Component에서 쿠키로 초기 로케일을 읽습니다.
 * "use client" 없이 서버에서 안전하게 import 가능합니다.
 */

import type { LocaleCode } from "@/lib/i18n/types"

const LOCALE_COOKIE_KEY = "dotlink-locale"
const AUTO_TRANSLATE_COOKIE_KEY = "dotlink-auto-translate"

const VALID_LOCALES = new Set<string>([
  "ko", "en", "ja", "es", "fr", "de", "zh-CN", "zh-TW",
  "pt", "it", "vi", "th", "ru", "ar", "hi", "tr", "nl", "pl", "sv", "id",
])

export function getLocaleFromCookies(
  cookieStore: { get: (name: string) => { value: string } | undefined },
): LocaleCode {
  const raw = cookieStore.get(LOCALE_COOKIE_KEY)?.value
  if (raw && VALID_LOCALES.has(raw)) return raw as LocaleCode
  return "ko"
}

export function getAutoTranslateFromCookies(
  cookieStore: { get: (name: string) => { value: string } | undefined },
): boolean {
  const raw = cookieStore.get(AUTO_TRANSLATE_COOKIE_KEY)?.value
  if (raw !== undefined) return raw === "true"
  return true
}
