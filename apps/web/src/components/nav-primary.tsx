"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  isNavItemActive,
  type AdminNavItem,
} from "@/lib/nav/admin-nav"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

export function NavPrimary({
  items,
  icons,
}: {
  items: AdminNavItem[]
  icons: Record<AdminNavItem["icon"], IconSvgElement>
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                isActive={isNavItemActive(pathname, item.url)}
                tooltip={item.title}
                render={<Link href={item.url} />}
              >
                <HugeiconsIcon icon={icons[item.icon]} strokeWidth={2.5} />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
