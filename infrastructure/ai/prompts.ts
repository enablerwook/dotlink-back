/**
 * Gemini 분석 시스템 프롬프트
 *
 * - SYSTEM_INSTRUCTION: getGenerativeModel의 systemInstruction에 전달 (역할/원칙 정의)
 * - buildAnalysisPrompt: generateContent에 전달하는 user 메시지 (콘텐츠 데이터 + 응답 형식)
 */

import type { EngagementMetrics } from "@/lib/types"

// ── 시스템 인스트럭션 ──────────────────────────────────────────────────────────
// Gemini의 역할, 분석 원칙, 5개 분석 항목 정의
export const SYSTEM_INSTRUCTION = `당신은 숏폼 콘텐츠 전문 분석가입니다.
반드시 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 반환하세요.
응답의 모든 텍스트에 **, *, #, >, _ 등 마크다운 기호를 절대 사용하지 마세요. 줄바꿈(\\n)은 허용합니다.

# 분석 원칙
이 영상은 인스타그램 릴스 콘텐츠입니다.
인스타그램에서 높은 조회수가 나오려면 초반 5초 이내 이탈 방지와 높은 시청 지속시간이 핵심입니다.
알고리즘이 재미있는 영상으로 판단하고 더 많은 시청자에게 확산되기 위한 요소를 분석합니다.

# 분석 항목

1. [content_type] 이 영상의 장르를 5개 이내로 정의합니다.
   예) 웃음, 감동, 공감, 스릴러, 멜로, 스토리텔링, 에피소드, 도전 등

2. [hook_analysis] 정의된 장르 관점에서, 초반 5초 동안 시청자가 이탈하지 않고 계속 시청하게 된 이유를 구체적으로 분석합니다.

3. [production_note] 정의된 장르 관점에서, 시청 지속시간이 오래 유지된 이유를 분석합니다.
   한 문장, 한 문단 단위로 어떤 요소가 좋았는지 분석합니다.

4. [engagement_analysis] 정의된 장르 관점에서, 좋아요를 누른 이유 / 댓글을 유도한 포인트 / 공유·저장을 유도한 포인트 / 팔로우를 유도한 포인트 / 반복 재생을 유도한 포인트를 분석합니다.
   포인트가 없으면 '특별한 포인트가 없었다'고 작성합니다.
   주의: 확신에 찬 어조가 아닌 차분한 분석 어조를 사용합니다.
   예) '극대화했습니다(✗)' → '유도했습니다(✓)'

5. [selling_point] 제품 판매 또는 홍보 의도가 있었는지 판단합니다.
   없으면 '제품 홍보 의도 없음'이라고 작성합니다.
   있으면 어떤 방식으로 자연스럽게 홍보했는지 분석합니다.

6. [difficulty] 기획/촬영/편집 난이도를 1(매우 쉬움)~5(매우 어려움) 정수로 평가합니다.

# 주의사항
'수미상관구조', '펀치라인' 등 초보 크리에이터에게 생소한 용어는 괄호 안에 간략한 뜻을 붙여 설명합니다.
예) 수미상관구조(처음과 끝을 같은 소재로 연결하는 구성)`

// ── 유저 메시지 빌더 ──────────────────────────────────────────────────────────
// 분석 대상 콘텐츠 데이터 + 응답 JSON 형식 명세 전달
export function buildAnalysisPrompt(
  script: string,
  caption: string,
  metrics: EngagementMetrics,
  hasVideo = false,
): string {
  const engagementRatio =
    metrics.views > 0
      ? (((metrics.likes + metrics.comments) / metrics.views) * 100).toFixed(2)
      : "0"

  const videoNote = hasVideo
    ? "\n\n[영상이 첨부되어 있습니다. 영상을 직접 시청하여 시각적 요소, 편집 리듬, 자막, 표정, 화면 전환 등을 포함해 분석하세요.]"
    : ""

  return `## 분석 대상 콘텐츠${videoNote}
캡션: ${caption || "(없음)"}
전체 대본: ${script ? script.slice(0, 2000) + (script.length > 2000 ? "..." : "") : "(음성 없음)"}

## 참여 지표
조회수: ${metrics.views.toLocaleString()} / 좋아요: ${metrics.likes.toLocaleString()} / 댓글: ${metrics.comments.toLocaleString()} / 참여율: ${engagementRatio}%

## 응답 형식 (JSON)
주의: engagement_analysis는 객체가 아닌 하나의 문자열(string)로 반환하세요. 5개 항목을 줄바꿈으로 구분합니다.
{
  "content_type": "장르 분류 및 설명",
  "hook_analysis": "초반 5초 이탈 방지 분석",
  "engagement_analysis": "좋아요 유도: (분석내용)\n댓글 유도: (분석내용)\n공유·저장 유도: (분석내용)\n팔로우 유도: (분석내용)\n반복재생 유도: (분석내용)",
  "selling_point": "제품 홍보 의도 분석",
  "difficulty": { "planning": 1, "filming": 1, "editing": 1 },
  "production_note": "시청 지속시간 유지 요인 분석 (문장/문단별)"
}`
}
