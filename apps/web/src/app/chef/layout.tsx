import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Metadata } from "next"
import { AdminBreadcrumb } from "@/app/admin/_components/admin-breadcrumb"
import BackgroundColors from "@/components/ui/background-colors"

export const metadata: Metadata = {
  title: {
    default: 'Happy Melon (Chefe)',
    template: '%s | Happy Melon (Chefe)',
  }
}

export default function ChefLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <BackgroundColors />
      <AppSidebar variant="floating" area="chef" />
      <SidebarInset className="relative z-10 bg-transparent">
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <AdminBreadcrumb />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
