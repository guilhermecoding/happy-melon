import { Crown03Icon, BalloonIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { Card } from '@/components/pouf/surface';

interface BoxOptionProps {
    title: string;
    type: 'contests' | 'users';
}

export default function BoxOption({ title, type }: BoxOptionProps) {
    const iconElement = type === 'contests' ? BalloonIcon : Crown03Icon;
    const href = type === 'contests' ? 'competicoes' : 'administradores';

    return (
        <div className="w-full md:w-52">
            <Card motion="lift">
                <Link
                    className="relative flex h-28 w-full overflow-hidden outline-none"
                    href={`/admin/${href}`}
                >
                    <h2 className="text-xl font-bold text-ink">{title}</h2>
                    <HugeiconsIcon
                        icon={iconElement}
                        className="absolute -right-5 -bottom-8 size-32 opacity-5"
                    />
                </Link>
            </Card>
        </div>
    )
}
