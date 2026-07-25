import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DateTimeIcon, Flag02Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { formatDateTime } from '@/lib/format-data';
import Link from 'next/link';

interface ContestCardProps {
    name: string;
    id: string;
    status: 'active' | 'inactive';
    condition: 'not_started' | 'in_progress' | 'finished';
    startDate: Date;
    endDate: Date;
}

export default function ContestCard({
    name,
    id,
    status,
    condition,
    startDate,
    endDate
}: ContestCardProps) {

    return (
        <Link
            href={`/admin/competicoes/${id}`}
            className='bg-muted/20 p-4 border-4 border-border rounded-4xl flex flex-col gap-1 hover:bg-muted/70 transition-all duration-300'
        >
            <h1 className='text-xl font-bold'>{name}</h1>
            <span className='text-sm text-muted-foreground mb-2'>ID: {id}</span>
            <div className='flex items-start sm:items-center gap-2 text-muted-foreground'>
                <HugeiconsIcon
                    icon={ViewIcon}
                    className='size-4'
                    strokeWidth={2}
                />
                <span className='text-sm font-medium'>{status === 'active' ? 'Habilitada' : 'Desabilitada'}</span>
            </div>
            <div className='flex items-start sm:items-center gap-2 text-muted-foreground'>
                <HugeiconsIcon
                    icon={Flag02Icon}
                    className='size-4'
                    strokeWidth={2}
                />
                <span className='text-sm font-medium'>{condition === 'finished' ? 'Finalizada' : 'Em andamento'}</span>
            </div>
            <div className='flex items-start sm:items-center gap-2 text-muted-foreground'>
                <HugeiconsIcon
                    icon={DateTimeIcon}
                    className='size-4'
                    strokeWidth={2}
                />
                <span className='text-sm font-medium'>
                    {formatDateTime(startDate)} &bull; {formatDateTime(endDate)}
                </span>
            </div>
        </Link>
    )
}
