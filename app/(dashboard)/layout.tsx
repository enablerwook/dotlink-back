import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/shared/app-sidebar"
import { AppProvider } from "@/domains/synapse/app-context"
import { AuthProvider } from "@/domains/auth/auth-context"
import { Separator } from "@/components/ui/separator"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <AppProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <span className="text-sm font-medium text-muted-foreground">DotLink</span>
            </header>
            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </AppProvider>
    </AuthProvider>
  )
}
