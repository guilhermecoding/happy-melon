"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentPropsWithoutRef, ReactNode } from "react"

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

export function NavSecondary({
  items,
  icons,
  ...props
}: {
  items: AdminNavItem[]
  icons: Record<AdminNavItem["icon"], IconSvgElement>
} & ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname()

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                size="sm"
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
