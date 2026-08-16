"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { DropdownMenu, type MenuEntry } from "@/components/pouf/menu"
import { IconSelector } from "@tabler/icons-react"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import { LogoutCircle01Icon } from "@hugeicons/core-free-icons"

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

  const items: (MenuEntry | "separator")[] = []
  if (aboutHref) {
    items.push(
      {
        label: "Sobre",
        icon: "info",
        onClick: () => router.push(aboutHref),
      },
      "separator",
    )
  }
  items.push({
    label: "Sair",
    icon: <HugeiconsIcon icon={LogoutCircle01Icon} className="size-4" strokeWidth={2.5} />,
    onClick: () => void handleSignOut(),
    disabled: isSigningOut || !user,
  })

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu
          label="Menu do usuário"
          align="end"
          side={isMobile ? "bottom" : "right"}
          items={items}
        >
          <SidebarMenuButton
            size="lg"
            className={
              compact
                ? "aria-expanded:bg-muted justify-between gap-2 overflow-hidden"
                : "aria-expanded:bg-muted justify-end"
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
          </SidebarMenuButton>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
