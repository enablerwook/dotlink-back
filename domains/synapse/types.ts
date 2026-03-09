/** Creation Card 9단계 기획서 내용 — steps JSONB 내부 구조 */
export interface CreationSteps {
  draft_script:  string  // 1. 스크립트 작성 (초안)
  content_type:  string  // 2. 콘텐츠 유형 정의
  hook_text:     string  // 3. 후킹 매력 요소 (대사)
  hook_visual:   string  // 4. 후킹 매력 요소 (영상)
  engagement:    string  // 5. 인게이지먼트 유도 장치
  caption:       string  // 6. 캡션 작성
  selling_point: string  // 7. 세일즈 포인트
  production:    string  // 8. 연출요소
  final_script:  string  // 9. 스크립트 (최종안)
}

/** creation_cards DB 엔티티 */
export interface CreationCard {
  id:            string
  userId:        string
  sourceCardAId: string | null
  sourceCardBId: string | null
  title:         string | null
  steps:         CreationSteps
  droppedFrames: Record<string, DroppedFrame[]>
  createdAt:     string
  updatedAt:     string
}

/** AI 두 카드 비교 분석 결과 */
export interface ComparisonResult {
  similarities:        string[]
  differences:         string[]
  combinationInsights: string[]
}

/** 로컬 임시저장 — 드롭된 프레임 단일 항목 */
export interface DroppedFrame {
  id:         string
  gradient:   string
  label:      string
  sourceCard: string  // "Card A" | "Card B"
  imageUrl?:  string  // 실제 이미지 URL (있을 경우)
}

/** 로컬 임시저장 — 브라우저 localStorage 기획안 스냅샷 */
export interface CreationSaveData {
  id:            string
  title?:        string
  savedAt:       string
  values:        Record<string, string>
  droppedFrames: Record<string, DroppedFrame[]>
}
