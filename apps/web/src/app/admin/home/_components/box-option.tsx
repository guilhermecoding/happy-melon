import { Tone } from '@/components/pouf/tone';
import { cn } from '@/lib/utils';
import { Crown03Icon, BalloonIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';

interface BoxOptionProps {
    title: string;
    type: 'contests' | 'users';
    tone: Tone;
}

export default function BoxOption({ title, type, tone }: BoxOptionProps) {
    const iconElement = type === 'contests' ? BalloonIcon : Crown03Icon;
    const href = type === 'contests' ? 'competicoes' : 'administradores';

    return (
        <div className="w-full md:w-56">
            <div
                className={cn(
                    'rounded-3xl border-y-6 border-t-purple-100 border-b-mint-300/70',
                    'transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                    'hover:-translate-y-1 hover:shadow-[0_10px_24px_-12px_rgba(58,46,92,0.35)]',
                    'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none',
                    {
                        'bg-mint': tone === 'mint',
                        'bg-purple': tone === 'purple',
                        'bg-pink': tone === 'pink',
                        'bg-orange': tone === 'orange',
                    },
                    {
                        'border-t-emerald-100 border-b-emerald-300/70': tone === 'mint',
                        'border-t-purple-200 border-b-purple-400/70': tone === 'purple',
                        'border-t-pink-100 border-b-pink-300/70': tone === 'pink',
                        'border-t-orange-100 border-b-orange-300/70': tone === 'orange',
                    },
                )}
            >
                <Link
                    className="relative flex h-36 w-full overflow-hidden rounded-card p-4 outline-none"
                    href={`/admin/${href}`}
                >
                    <h2 className="relative z-10 truncate text-xl font-bold text-ink">
                        {title}
                    </h2>
                    <HugeiconsIcon
                        icon={iconElement}
                        aria-hidden
                        className="pointer-events-none absolute -right-5 -bottom-8 size-32 opacity-5"
                    />
                </Link>
            </div>
        </div>
    )
}
