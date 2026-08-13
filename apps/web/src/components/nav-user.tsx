"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { IconInfoCircle, IconLogout, IconSelector } from "@tabler/icons-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  const first = parts[0] ?? ""
  if (parts.length === 1) return first.slice(0, 2).toUpperCase()
  const last = parts[parts.length - 1] ?? ""
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
}

export function NavUser({
  user,
  compact = false,
  aboutHref,
  onBeforeSignOut,
}: {
  user: {
    name: string
    email: string
    avatar?: string
  } | null;
  compact?: boolean;
  aboutHref?: string;
  onBeforeSignOut?: () => void;
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const displayName = user?.name ?? "—"
  const displayEmail = user?.email ?? "—"
  const initials = user?.name ? getInitials(user.name) : "?"

  async function handleSignOut() {
    if (isSigningOut) return
    setIsSigningOut(true)
    try {
      onBeforeSignOut?.()
      await authClient.signOut()
      router.push("/entrar")
      router.refresh()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className={
                  compact
                    ? "aria-expanded:bg-muted justify-between gap-2 overflow-hidden"
                    : "aria-expanded:bg-muted justify-end"
                }
              />
            }
          >
            <Avatar className="shrink-0">
              {user?.avatar ? (
                <AvatarImage src={user.avatar} alt={displayName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className={cn("grid min-w-0 flex-1 text-left text-sm leading-tight", {
              "hidden md:grid": compact,
            })}>
              <span className="truncate font-medium">{displayName}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {displayEmail}
              </span>
            </div>

            <IconSelector className="size-4 shrink-0" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar>
                    {user?.avatar ? (
                      <AvatarImage src={user.avatar} alt={displayName} />
                    ) : null}
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {displayEmail}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            {aboutHref ? (
              <>
                <DropdownMenuItem render={<Link href={aboutHref} />}>
                  <IconInfoCircle />
                  Sobre
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            ) : null}
            <DropdownMenuItem
              disabled={isSigningOut || !user}
              onClick={handleSignOut}
            >
              <IconLogout />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
