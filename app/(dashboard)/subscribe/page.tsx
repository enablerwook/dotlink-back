"use client"

import { useState } from "react"
import { Check, CreditCard, ArrowLeft, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { pricingPlans } from "@/lib/mock-data"

type Step = "plans" | "payment"

export default function SubscribePage() {
  const [step, setStep] = useState<Step>("plans")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [referralCode, setReferralCode] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)

  const plan = pricingPlans.find((p) => p.name === selectedPlan)

  function handleSelectPlan(planName: string) {
    setSelectedPlan(planName)
    setStep("payment")
  }

  function handlePayment() {
    setIsProcessing(true)
    setTimeout(() => {
      setIsProcessing(false)
      alert("결제가 완료되었습니다! (데모)")
      setStep("plans")
      setSelectedPlan(null)
    }, 1500)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">구독</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          나에게 맞는 플랜을 선택하고 콘텐츠 분석을 시작하세요.
        </p>
      </div>

      {step === "plans" && (
        <div className="grid gap-6 md:grid-cols-3">
          {pricingPlans.map((p) => (
            <Card
              key={p.name}
              className={
                p.highlighted
                  ? "relative border-primary bg-card shadow-lg shadow-primary/5"
                  : "border-border/50 bg-card/50"
              }
            >
              {p.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge>추천</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-base">
                  {p.nameKo}{" "}
                  <span className="text-xs font-normal text-muted-foreground">({p.name})</span>
                </CardTitle>
                <div className="flex items-baseline gap-1">
                  {p.price === "무료" ? (
                    <span className="text-3xl font-bold">무료</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">{p.price}</span>
                      <span className="text-sm text-muted-foreground">원/{p.period}</span>
                    </>
                  )}
                </div>
                <CardDescription>{p.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2.5">
                  {p.features.map((feature) => (
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
                  variant={p.highlighted ? "default" : "outline"}
                  onClick={() => handleSelectPlan(p.name)}
                >
                  {p.price === "무료" ? "무료로 시작하기" : "구독하기"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {step === "payment" && plan && (
        <div className="mx-auto max-w-lg">
          <Button
            variant="ghost"
            size="sm"
            className="mb-6"
            onClick={() => setStep("plans")}
          >
            <ArrowLeft className="mr-1 size-4" />
            플랜 선택으로 돌아가기
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="size-5" />
                결제 정보
              </CardTitle>
              <CardDescription>
                {plan.nameKo} 플랜 ({plan.price === "무료" ? "무료" : `${plan.price}원/${plan.period}`})
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {/* Selected plan summary */}
              <div className="rounded-lg border bg-secondary/30 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{plan.nameKo}</span>
                  <span className="font-bold">
                    {plan.price === "무료" ? "무료" : `${plan.price}원/${plan.period}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{plan.description}</p>
              </div>

              <Separator />

              {/* Card details */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cardName">카드 소유자 이름</Label>
                  <Input id="cardName" placeholder="홍길동" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="cardNumber">카드 번호</Label>
                  <Input id="cardNumber" placeholder="0000 0000 0000 0000" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="expiry">유효기간</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cvc">CVC</Label>
                    <Input id="cvc" placeholder="000" />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Referral code */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="referral" className="flex items-center gap-1.5">
                  <Gift className="size-4 text-primary" />
                  추천인 코드
                </Label>
                <Input
                  id="referral"
                  placeholder="추천인 코드를 입력하세요 (선택사항)"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  추천인 코드를 입력하면 첫 달 20% 할인이 적용됩니다.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    결제 처리 중...
                  </span>
                ) : (
                  <>
                    <CreditCard className="mr-2 size-4" />
                    {plan.price === "무료" ? "무료 플랜 시작하기" : `${plan.price}원 결제하기`}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}
