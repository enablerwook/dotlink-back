"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  FlaskConical,
  FolderOpen,
  Home,
  Lightbulb,
  Zap,
  LogOut,
  CreditCard,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/domains/auth/auth-context"

const navItems = [
  { title: "홈", href: "/", icon: Home },
  { title: "분석", href: "/analysis", icon: FlaskConical },
  { title: "라이브러리", href: "/library", icon: FolderOpen },
  { title: "조합 모드", href: "/synapse", icon: Zap },
  { title: "기능 요청", href: "/feature-request", icon: Lightbulb },
  { title: "구독", href: "/subscribe", icon: CreditCard },
  { title: "설정", href: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.push("/login")
    router.refresh()
  }

  // 이메일 앞 두 글자를 아바타 이니셜로 사용
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??"

  return (
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="px-4 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Zap className="size-4" />
          </div>
          <span className="text-lg font-bold tracking-tight group-data-[collapsible=icon]:hidden">
            DotLink
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메뉴</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        {/* 유저 정보 + 로그아웃 */}
        <div className="flex items-center gap-2 rounded-lg px-1 py-2">
          <Avatar className="size-7 shrink-0">
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
            <span className="truncate text-xs font-medium">
              {user?.email ?? "로그인 중..."}
            </span>
            <span className="text-[10px] text-muted-foreground">Starter</span>
          </div>
          <button
            onClick={handleSignOut}
            className="shrink-0 text-muted-foreground hover:text-foreground group-data-[collapsible=icon]:hidden"
            aria-label="로그아웃"
            title="로그아웃"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
