/**
 * 분석 탭 정의 — 단일 진실 소스 (SSOT)
 *
 * UI 탭 순서, 필드 키, 레이블이 모두 여기서 관리됩니다.
 * analysis-results.tsx, content-card.tsx, comparison-card.tsx 등 모든 컴포넌트가 이 파일을 참조합니다.
 * 필드명/레이블 변경 시 이 파일 한 곳만 수정하면 됩니다.
 */

/** 텍스트 기반 6개 탭 (engagement, difficulty는 별도 처리) */
export const ANALYSIS_TEXT_TABS = [
  { key: "content_type",  label: "콘텐츠 유형", short: "유형" },
  { key: "hooking",       label: "후킹",         short: "후킹" },
  { key: "script",        label: "스크립트",     short: "스크립트" },
  { key: "caption",       label: "캡션",         short: "캡션" },
  { key: "production",    label: "연출",         short: "연출" },
  { key: "selling_point", label: "세일즈",       short: "세일즈" },
] as const

export type AnalysisTextTabKey = typeof ANALYSIS_TEXT_TABS[number]["key"]

/** 카드 뒷면 오버레이에 표시할 요약 섹션 (4개) */
export const ANALYSIS_CARD_SECTIONS = [
  { key: "content_type", label: "콘텐츠 유형" },
  { key: "hooking",      label: "후킹" },
  { key: "production",   label: "연출" },
  { key: "selling_point", label: "세일즈" },
] as const

export type AnalysisCardSectionKey = typeof ANALYSIS_CARD_SECTIONS[number]["key"]
