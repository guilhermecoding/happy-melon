import { Crown03Icon, BalloonIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';

interface BoxOptionProps {
    title: string;
    type: 'contests' | 'users';
}

export default function BoxOption({ title, type }: BoxOptionProps) {
    const iconElement = type === 'contests' ? BalloonIcon : Crown03Icon;
    const href = type === 'contests' ? 'competicoes' : 'administradores';

    return (
        <Link
            className='w-full md:w-52 h-36 bg-muted p-4 rounded-4xl relative overflow-hidden border-4 border-border hover:border-border-hover transition-colors duration-300 cursor-pointer'
            href={`/admin/${href}`}
        >
            <h2 className='text-xl font-semibold'>{title}</h2>
            <HugeiconsIcon
                icon={iconElement}
                className='size-32 absolute -bottom-8 opacity-5 -right-5'
            />
        </Link>
    )
}
