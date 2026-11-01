import type { IconSvgElement } from '@hugeicons/react'
import { HugeiconsIcon } from '@hugeicons/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { Tone } from '@/components/pouf/tone'

type StaffOptionCardProps = {
  title: string
  href: string
  tone: Extract<Tone, 'mint' | 'orange'>
  icon: IconSvgElement
}

export function StaffOptionCard({
  title,
  href,
  tone,
  icon,
}: StaffOptionCardProps) {
  return (
    <div className="w-full md:w-56">
      <div
        className={cn(
          'rounded-3xl border-y-6',
          'transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
          'hover:-translate-y-1 hover:shadow-[0_10px_24px_-12px_rgba(58,46,92,0.35)]',
          'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none',
          tone === 'mint' ? 'bg-mint' : 'bg-orange',
          tone === 'mint'
            ? 'border-t-emerald-100 border-b-emerald-300/70'
            : 'border-t-orange-100 border-b-orange-300/70',
        )}
      >
        <Link
          className="relative flex h-36 w-full overflow-hidden rounded-card p-4 outline-none"
          href={href}
        >
          <h2 className="relative z-10 truncate text-xl font-bold text-ink">
            {title}
          </h2>
          <HugeiconsIcon
            icon={icon}
            aria-hidden
            className="pointer-events-none absolute -right-5 -bottom-8 size-32 opacity-5"
          />
        </Link>
      </div>
    </div>
  )
}
