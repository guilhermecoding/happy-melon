'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import {
  CONTEST_ACCESS_EVENT_TYPE,
  type ContestAccessEvent,
} from '@repo/shared'
import { NavUser } from '@/components/nav-user'
import Logo from '@/components/logo'
import { SidebarProvider } from '@/components/ui/sidebar'
import BackgroundColors from '@/components/ui/background-colors'
import { toast } from '@/components/pouf/toaster'
import { authClient } from '@/lib/auth-client'
import { contestService } from '@/services/contest/contest.service'

export function StaffShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()
  const hadSessionRef = useRef(false)
  const signingOutRef = useRef(false)
  const userId = session?.user?.id ?? null
  const contestId = session?.session?.activeContestId
  const homeHref = contestId ? `/staff/${contestId}` : '/entrar'

  const user = session?.user
    ? {
        name: session.user.name,
        email: session.user.email,
        avatar: session.user.image ?? undefined,
      }
    : null

  useEffect(() => {
    if (session) {
      hadSessionRef.current = true
    }
  }, [session])

  useEffect(() => {
    if (isPending) {
      return
    }

    if (!session && hadSessionRef.current) {
      hadSessionRef.current = false
      if (!signingOutRef.current) {
        toast.error(
          'O acesso dos colaboradores foi desabilitado. Você foi desconectado.',
        )
        router.replace('/entrar')
        router.refresh()
      }
    }
  }, [session, isPending, router])

  useEffect(() => {
    if (!contestId || !userId) {
      return
    }

    let cancelled = false

    async function forceLogout(message: string) {
      if (cancelled || signingOutRef.current) {
        return
      }
      signingOutRef.current = true
      hadSessionRef.current = false
      toast.error(message)
      try {
        await authClient.signOut()
      } finally {
        router.replace('/entrar')
        router.refresh()
        signingOutRef.current = false
      }
    }

    function handleAccessEvent(event: ContestAccessEvent) {
      if (event.type === CONTEST_ACCESS_EVENT_TYPE.COLLABORATORS_DISABLED) {
        void forceLogout(
          'O acesso dos colaboradores foi desabilitado. Você foi desconectado.',
        )
        return
      }

      if (
        event.type === CONTEST_ACCESS_EVENT_TYPE.COLLABORATOR_REVOKED &&
        event.userId === userId
      ) {
        void forceLogout(
          'Seu acesso a esta competição foi desabilitado. Você foi desconectado.',
        )
      }
    }

    const source = new EventSource(
      contestService.getAccessEventsUrl(contestId),
      { withCredentials: true },
    )

    source.onmessage = (message) => {
      const event = contestService.parseAccessEventData(message.data)
      if (!event) return
      handleAccessEvent(event)
    }

    source.onerror = () => {
      // Browser reconnects EventSource automatically.
    }

    return () => {
      cancelled = true
      source.close()
    }
  }, [contestId, userId, router])

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
