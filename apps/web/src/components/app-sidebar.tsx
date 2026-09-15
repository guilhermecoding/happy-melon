"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavPrimary } from "@/components/nav-primary"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Logo from "./logo"
import { authClient } from "@/lib/auth-client"
import {
  getPrimaryNavItems,
  secondaryNavItems,
  type AdminNavIcon,
} from "@/lib/nav/admin-nav"
import {
  chefSecondaryNavItems,
  getChefPrimaryNavItems,
} from "@/lib/nav/chef-nav"
import {
  BadgeInfoIcon,
  BalloonIcon,
  ClipboardCheckIcon,
  Crown03Icon,
  GoogleDocIcon,
  Home05Icon,
  MenuCircleIcon,
  ThumbsUpIcon,
  UserMultiple02Icon
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"

const navIcons: Record<AdminNavIcon, IconSvgElement> = {
  home: Home05Icon,
  competicoes: BalloonIcon,
  administradores: Crown03Icon,
  chefes: Crown03Icon,
  overview: MenuCircleIcon,
  colaboradores: ThumbsUpIcon,
  prova: GoogleDocIcon,
  tarefas: ClipboardCheckIcon,
  times: UserMultiple02Icon,
  sobre: BadgeInfoIcon,
}

export function AppSidebar({
  area = "admin",
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  area?: "admin" | "chef"
}) {
  const pathname = usePathname()
  const { data: session } = authClient.useSession()

  const homeHref = area === "chef" ? "/chef" : "/admin"
  const primaryItems =
    area === "chef"
      ? getChefPrimaryNavItems(pathname)
      : getPrimaryNavItems(pathname)
  const secondaryItems =
    area === "chef" ? chefSecondaryNavItems : secondaryNavItems
  const user = session?.user
    ? {
      name: session.user.name,
      email: session.user.email,
      avatar: session.user.image ?? undefined,
    }
    : null

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href={homeHref} />}
              className="flex justify-center my-4"
            >
              <Logo className="size-36" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavPrimary items={primaryItems} icons={navIcons} />
        <NavSecondary
          items={secondaryItems}
          icons={navIcons}
          className="mt-auto"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
