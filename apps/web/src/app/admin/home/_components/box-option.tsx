import { ChampionIcon, UserMultipleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

interface BoxOptionProps {
    title: string;
    type: 'contests' | 'users';
}

export default function BoxOption({ title, type }: BoxOptionProps) {
    const iconElement = type === 'contests' ? ChampionIcon : UserMultipleIcon;

    return (
        <div className='w-52 h-36 bg-muted p-4 rounded-4xl relative overflow-hidden'>
            <h2 className='text-xl font-semibold'>{title}</h2>
            <HugeiconsIcon
                icon={iconElement}
                className='size-32 absolute -bottom-8 opacity-5 -right-5'
            />
        </div>
    )
}
