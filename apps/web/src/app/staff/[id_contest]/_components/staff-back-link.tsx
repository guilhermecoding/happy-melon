import Link from 'next/link'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

export function StaffBackLink({ href }: { href: string }) {
  return (
    <div className="px-4 pt-4 md:px-6">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-ink"
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          className="size-4"
          strokeWidth={2}
        />
        Voltar
      </Link>
    </div>
  )
}
