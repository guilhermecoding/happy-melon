'use client'

import Link from 'next/link'
import { NavUser } from '@/components/nav-user'
import Logo from '@/components/logo'
import { SidebarProvider } from '@/components/ui/sidebar'
import BackgroundColors from '@/components/ui/background-colors'
import { authClient } from '@/lib/auth-client'

export function StaffShell({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession()
  const contestId = session?.session?.activeContestId
  const homeHref = contestId ? `/staff/${contestId}` : '/entrar'

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image ?? undefined,
      }
    : null

  return (
    <SidebarProvider>
      <BackgroundColors />
      <div className="relative z-10 flex h-svh w-full flex-col bg-transparent">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b px-4 md:px-6">
          <Link href={homeHref} className="flex items-center">
            <Logo className="size-28" />
          </Link>
          <div className="min-w-0 max-w-56">
            <NavUser user={user} compact />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-auto">{children}</main>
      </div>
    </SidebarProvider>
  )
}
