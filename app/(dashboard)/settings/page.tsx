"use client"

import { useState } from "react"
import { Copy, Check, User, CreditCard, Hash, FlaskConical } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

// Mock user data
const mockUser = {
  name: "김도현",
  email: "dohyun@example.com",
  plan: "Creator" as const,
  planKo: "크리에이터",
  referralCode: "DOTLINK-KDH2026",
  monthlyAnalysisUsed: 18,
  monthlyAnalysisTotal: 50,
  joinedDate: "2026-01-15",
}

export default function SettingsPage() {
  const [copied, setCopied] = useState(false)

  const usagePercent = Math.round(
    (mockUser.monthlyAnalysisUsed / mockUser.monthlyAnalysisTotal) * 100
  )
  const remaining = mockUser.monthlyAnalysisTotal - mockUser.monthlyAnalysisUsed

  function handleCopyCode() {
    navigator.clipboard.writeText(mockUser.referralCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">설정</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          내 계정 정보와 구독 상태를 확인하세요.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Profile info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="size-4" />
              프로필
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" defaultValue={mockUser.name} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">이메일</Label>
              <Input id="email" defaultValue={mockUser.email} type="email" />
            </div>
            <Button size="sm" className="w-fit">
              저장
            </Button>
          </CardContent>
        </Card>

        {/* Subscription info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4" />
              현재 구독
            </CardTitle>
            <CardDescription>현재 이용 중인 플랜 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{mockUser.planKo}</span>
                  <Badge variant="outline">{mockUser.plan}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  29,000원/월
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/subscribe">플랜 변경</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral code */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Hash className="size-4" />
              추천인 코드
            </CardTitle>
            <CardDescription>
              친구에게 공유하면 첫 달 20% 할인을 드립니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={mockUser.referralCode}
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                aria-label="추천인 코드 복사"
              >
                {copied ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Monthly analysis usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FlaskConical className="size-4" />
              월 분석 횟수
            </CardTitle>
            <CardDescription>이번 달 사용량을 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">사용량</span>
                <span className="font-medium">
                  {mockUser.monthlyAnalysisUsed} / {mockUser.monthlyAnalysisTotal}회
                </span>
              </div>
              <Progress value={usagePercent} className="h-2" />
            </div>
            <Separator />
            <div className="flex items-center justify-between rounded-lg border bg-secondary/30 p-4">
              <div>
                <p className="text-sm text-muted-foreground">남은 분석 횟수</p>
                <p className="text-2xl font-bold">{remaining}회</p>
              </div>
              <Badge variant={remaining > 10 ? "secondary" : "destructive"}>
                {usagePercent}% 사용
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              매월 1일에 분석 횟수가 초기화됩니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
