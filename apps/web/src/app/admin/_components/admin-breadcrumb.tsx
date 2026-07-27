"use client"

import { Fragment } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  home: "Início",
  competicoes: "Competições",
  administradores: "Administradores",
  prova: "Prova",
  teste: "Teste",
}

type Crumb = {
  href: string
  label: string
}

type CrumbOrEllipsis = Crumb | { type: "ellipsis" }

function formatSegment(segment: string) {
  return SEGMENT_LABELS[segment] ?? decodeURIComponent(segment)
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split("/").filter(Boolean)

  return segments.map((segment, index) => ({
    href: `/${segments.slice(0, index + 1).join("/")}`,
    label: formatSegment(segment),
  }))
}

function truncateCrumbs(crumbs: Crumb[]): CrumbOrEllipsis[] {
  if (crumbs.length <= 4) {
    return crumbs
  }

  return [
    crumbs[0],
    { type: "ellipsis" },
    crumbs[crumbs.length - 2],
    crumbs[crumbs.length - 1],
  ]
}

export function AdminBreadcrumb() {
  const pathname = usePathname()
  const crumbs = truncateCrumbs(buildCrumbs(pathname))

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const isFirst = index === 0

          if ("type" in crumb) {
            return (
              <Fragment key="ellipsis">
                <BreadcrumbItem>
                  <BreadcrumbEllipsis />
                </BreadcrumbItem>
                {!isLast && <BreadcrumbSeparator />}
              </Fragment>
            )
          }

          return (
            <Fragment key={crumb.href}>
              <BreadcrumbItem className={isFirst && !isLast ? "hidden md:block" : undefined}>
                {isLast ? (
                  <BreadcrumbPage className="max-w-48 truncate">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={crumb.href} />}
                    className="max-w-48 truncate"
                  >
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && (
                <BreadcrumbSeparator
                  className={isFirst ? "hidden md:block" : undefined}
                />
              )}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
