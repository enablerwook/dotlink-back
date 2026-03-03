import { GoogleGenerativeAI } from "@google/generative-ai"
import type { ContentCard } from "@/lib/types"

export interface CompareResult {
  hookVisual: string
  hookText: string
  script: string
  contentType: string
  caption: string
  storyboard: string
  engagement: string
  salesPoints: string
  difficulty: string
  aiInsights: string
  differentiation: string
  keywords: string[]
}

const COMPARE_PROMPT = (cardA: ContentCard, cardB: ContentCard) => `
당신은 숏폼 콘텐츠 전문 기획자입니다. 두 콘텐츠를 비교 분석하여 새로운 크리에이션 카드를 작성해주세요. 반드시 JSON 형식으로만 응답하세요.

## Card A: ${cardA.title} (${cardA.platform})
- 3초 후킹 영상: ${cardA.analysis.hook_analysis}
- 3초 후킹 텍스트: ${cardA.analysis.hook_text}
- 전체 대본: ${cardA.analysis.full_script}
- 캡션: ${cardA.analysis.caption}
- 촬영/편집 스타일: ${cardA.analysis.production_note}
- 인게이지먼트 분석: ${cardA.analysis.engagement.analysis}
- 콘텐츠 유형: ${cardA.analysis.content_type}
- 세일즈/소구점: ${cardA.analysis.selling_point}

## Card B: ${cardB.title} (${cardB.platform})
- 3초 후킹 영상: ${cardB.analysis.hook_analysis}
- 3초 후킹 텍스트: ${cardB.analysis.hook_text}
- 전체 대본: ${cardB.analysis.full_script}
- 캡션: ${cardB.analysis.caption}
- 촬영/편집 스타일: ${cardB.analysis.production_note}
- 인게이지먼트 분석: ${cardB.analysis.engagement.analysis}
- 콘텐츠 유형: ${cardB.analysis.content_type}
- 세일즈/소구점: ${cardB.analysis.selling_point}

## 작성 지침
두 콘텐츠의 성공 요소를 융합하여 새로운 콘텐츠 아이디어를 구체적으로 제안하세요.
각 항목은 실제 제작에 바로 활용할 수 있을 만큼 구체적으로 작성하세요.

## 응답 형식 (JSON만 반환, 다른 텍스트 없이)
{
  "aiInsights": "두 콘텐츠의 핵심 성공 요소 비교 분석 및 융합 전략 (3-4문장)",
  "differentiation": "기존 두 콘텐츠와 차별화되는 새 콘텐츠의 독자적 포지셔닝",
  "hookVisual": "새 콘텐츠의 3초 후킹 영상 요소 제안 (구체적 기법)",
  "hookText": "새 콘텐츠의 3초 후킹 텍스트/자막 제안 (실제 문구 예시 포함)",
  "contentType": "새 콘텐츠의 유형 분류 및 타깃 설정",
  "script": "새 콘텐츠의 전체 스크립트 초안 (구체적인 대사/나레이션)",
  "caption": "새 콘텐츠의 캡션 초안 (해시태그, CTA 포함)",
  "storyboard": "새 콘텐츠의 스토리보드/연출 방향 (씬별 설명)",
  "engagement": "인게이지먼트 유도 요소 (댓글 유도 질문, 저장 유도 장치 등)",
  "salesPoints": "세일즈/소구점 제안 (어떤 욕구를 자극할지)",
  "difficulty": "제작 난이도 평가 (기획/촬영/편집 각 1-5점 및 간략한 이유)",
  "keywords": ["핵심키워드1", "핵심키워드2", "핵심키워드3", "핵심키워드4", "핵심키워드5"]
}
`

export async function compareWithGemini(
  cardA: ContentCard,
  cardB: ContentCard,
): Promise<CompareResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY

  if (!apiKey) {
    throw new Error(
      "GOOGLE_GEMINI_API_KEY가 설정되지 않았습니다. .env.local을 확인해주세요.",
    )
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

  const prompt = COMPARE_PROMPT(cardA, cardB)
  const result = await model.generateContent(prompt)
  const text = result.response.text()

  const jsonText = text
    .replace(/^```json\s*/m, "")
    .replace(/^```\s*/m, "")
    .replace(/```\s*$/m, "")
    .trim()

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error(`Gemini 비교 분석 응답 파싱 실패: ${text.slice(0, 200)}`)
  }

  return {
    aiInsights: String(parsed.aiInsights ?? ""),
    differentiation: String(parsed.differentiation ?? ""),
    hookVisual: String(parsed.hookVisual ?? ""),
    hookText: String(parsed.hookText ?? ""),
    contentType: String(parsed.contentType ?? ""),
    script: String(parsed.script ?? ""),
    caption: String(parsed.caption ?? ""),
    storyboard: String(parsed.storyboard ?? ""),
    engagement: String(parsed.engagement ?? ""),
    salesPoints: String(parsed.salesPoints ?? ""),
    difficulty: String(parsed.difficulty ?? ""),
    keywords: Array.isArray(parsed.keywords)
      ? (parsed.keywords as string[]).map(String)
      : [],
  }
}
