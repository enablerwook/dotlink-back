# 07. 코딩 컨벤션 매뉴얼

## 파일/폴더 명명 규칙

| 대상 | 규칙 | 예시 |
|---|---|---|
| 파일명 | `kebab-case` | `analysis-service.ts`, `use-library.ts` |
| 컴포넌트 파일 | `kebab-case.tsx` | `dna-score-card.tsx` |
| 컴포넌트 함수 | `PascalCase` | `function DnaScoreCard()` |
| 일반 함수/변수 | `camelCase` | `const analysisResult` |
| 상수 | `UPPER_SNAKE_CASE` | `const PLAN_LIMITS` |
| 타입/인터페이스 | `PascalCase` | `interface AnalysisResult` |
| DB 컬럼 | `snake_case` | `analysis_count`, `created_at` |

---

## import 경로 alias

```typescript
// tsconfig.json paths
"@/*" → "./*"

// 사용 예
import { createClient } from "@/infrastructure/supabase/client"
import { AnalysisResult } from "@/domains/analysis/types"
import { DnaScoreCard } from "@/components/analysis/dna-score-card"
import { cn } from "@/lib/utils"
```

---

## 컴포넌트 작성 규칙

### "use client" 지시어
- 클라이언트 훅(`useState`, `useEffect`, `useRouter` 등) 사용 시 필수
- 이벤트 핸들러 사용 시 필수
- 불필요한 경우 서버 컴포넌트로 유지 (성능 우선)

### 컴포넌트 구조 순서
```typescript
// 1. imports
import ...

// 2. 타입 정의 (파일 내 로컬 타입)
type Props = { ... }

// 3. 컴포넌트 함수
export function ComponentName({ prop }: Props) {
  // 3a. 훅
  const [state, setState] = useState(...)

  // 3b. 파생 값
  const derivedValue = ...

  // 3c. 이벤트 핸들러
  function handleClick() { ... }

  // 3d. JSX
  return (...)
}

// 4. 하위 컴포넌트 (같은 파일에 있을 경우)
function SubComponent() { ... }
```

---

## API Route 작성 규칙

```typescript
// app/api/[domain]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/infrastructure/supabase/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // 1. 인증 확인
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. 비즈니스 로직 (domain service 호출)

  // 3. 응답
  return NextResponse.json({ data })
}
```

---

## 타입 작성 규칙

```typescript
// domains/[domain]/types.ts
// interface 우선 사용 (확장 용이)
export interface AnalysisResult {
  id: string
  userId: string
  url: string
  platform: Platform
  scores: DnaScore[]
  createdAt: string
}

// union type은 type alias 사용
export type Platform = "instagram" | "tiktok" | "youtube"
export type Plan = "starter" | "creator" | "pro"
```

---

## 에러 처리 패턴

```typescript
// API Route에서 에러 응답
return NextResponse.json(
  { error: "분석 횟수 한도를 초과했습니다." },
  { status: 403 }
)

// 클라이언트에서 에러 표시
const [error, setError] = useState<string | null>(null)
// → <p className="text-destructive">{error}</p>
```

---

## Supabase 쿼리 패턴

```typescript
// repository 파일에서 에러 처리
const { data, error } = await supabase
  .from("library_cards")
  .select("*")
  .eq("user_id", userId)
  .order("created_at", { ascending: false })

if (error) throw new Error(error.message)
return data
```

---

## 스타일링 규칙

- **Tailwind CSS v4** 유틸리티 클래스 우선
- **shadcn/ui** 컴포넌트 활용 (`components/ui/` — 직접 수정 금지)
- 클래스 조합: `cn()` 유틸 사용 (`lib/utils.ts`)

```typescript
import { cn } from "@/lib/utils"

<div className={cn("base-class", condition && "conditional-class", className)} />
```

---

## 금지사항

- `any` 타입 사용 금지 (불가피한 경우 `unknown` + 타입 가드)
- `console.log` 프로덕션 코드에 방치 금지
- `components/ui/` 파일 직접 수정 금지
- 하드코딩된 비밀 키 금지 (반드시 환경 변수 사용)
- `mock-data`를 실제 비즈니스 로직에 직접 연결 금지
