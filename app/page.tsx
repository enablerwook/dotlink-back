import Link from "next/link"
import {
  Zap,
  FlaskConical,
  FolderOpen,
  Layers,
  ArrowRight,
  Check,
  Play,
  Search,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { pricingPlans } from "@/lib/mock-data"

const steps = [
  {
    icon: Search,
    title: "URL 입력",
    description: "분석하고 싶은 숏폼 콘텐츠의 URL을 붙여넣기 하세요.",
  },
  {
    icon: FlaskConical,
    title: "DNA 분석",
    description: "AI가 콘텐츠를 9가지 차원으로 분석하여 성공 DNA를 추출합니다.",
  },
  {
    icon: Sparkles,
    title: "재조합 & 창작",
    description: "분석된 요소들을 조합하여 나만의 새로운 콘텐츠 대본을 설계합니다.",
  },
]

const features = [
  {
    icon: FlaskConical,
    title: "9단계 DNA 분석",
    description: "후킹, 스크립트, 캡션, 연출, 인게이지먼트 등 9가지 핵심 요소를 깊이 분석합니다.",
  },
  {
    icon: Layers,
    title: "시냅스 비교",
    description: "두 콘텐츠를 나란히 비교하고 성공 요소를 조합하여 새로운 대본을 만듭니다.",
  },
  {
    icon: FolderOpen,
    title: "뉴런 라이브러리",
    description: "분석한 모든 콘텐츠를 저장하고 언제든 다시 참고할 수 있습니다.",
  },
  {
    icon: Play,
    title: "프레임 캐러셀",
    description: "영상의 핵심 15프레임을 추출하여 시각적으로 분석할 수 있습니다.",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Zap className="size-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">DotLink</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/analysis">시작하기</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/analysis">무료 체험</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
        <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center md:py-32">
          <Badge variant="secondary" className="mb-6">
            Beta - 지금 무료로 시작하세요
          </Badge>
          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            {"숏폼 콘텐츠의 DNA를"}
            <br />
            <span className="text-primary">{"분석하고 재조합하세요"}</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            {"좋은 예술가는 베끼고, 위대한 예술가는 훔친다."}
            <br className="hidden sm:block" />
            {"성공한 콘텐츠의 비밀을 해독하고, 나만의 창작물로 재탄생시키세요."}
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/analysis">
                지금 분석 시작하기
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/library">라이브러리 둘러보기</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t bg-secondary/30 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight">어떻게 작동하나요?</h2>
            <p className="mt-3 text-muted-foreground">세 단계로 콘텐츠의 성공 DNA를 해독합니다.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.title} className="flex flex-col items-center text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <step.icon className="size-6" />
                </div>
                <span className="mb-1 text-xs font-medium text-muted-foreground">
                  Step {i + 1}
                </span>
                <h3 className="text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight">핵심 기능</h2>
            <p className="mt-3 text-muted-foreground">콘텐츠 분석부터 재창작까지, 필요한 모든 도구를 제공합니다.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 bg-card/50">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <feature.icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="border-t bg-secondary/30 py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight">요금제</h2>
            <p className="mt-3 text-muted-foreground">누구나 시작할 수 있는 무료 플랜부터 프로 플랜까지.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pricingPlans.map((plan) => (
              <Card
                key={plan.name}
                className={
                  plan.highlighted
                    ? "relative border-primary bg-card shadow-lg shadow-primary/5"
                    : "border-border/50 bg-card/50"
                }
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>추천</Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base">
                    {plan.nameKo}{" "}
                    <span className="text-xs font-normal text-muted-foreground">({plan.name})</span>
                  </CardTitle>
                  <div className="flex items-baseline gap-1">
                    {plan.price === "무료" ? (
                      <span className="text-3xl font-bold">무료</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold">{plan.price}</span>
                        <span className="text-sm text-muted-foreground">원/{plan.period}</span>
                      </>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <Link href="/analysis">{plan.cta}</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 text-center">
          <div className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded bg-primary text-primary-foreground">
              <Zap className="size-3" />
            </div>
            <span className="text-sm font-semibold">DotLink</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {"숏폼 콘텐츠 DNA 분석 & 재조합 도구. 2026 DotLink. All rights reserved."}
          </p>
        </div>
      </footer>
    </div>
  )
}
