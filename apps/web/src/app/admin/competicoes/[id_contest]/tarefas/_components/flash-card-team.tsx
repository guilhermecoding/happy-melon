import { ChevronDoubleCloseIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import React from 'react'

export default function FlashCardTeam() {
    return (
        <div className='w-full h-full flex flex-row justify-between items-center gap-4 bg-white rounded-2xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors cursor-pointer'>
            <div className="shrink-0">
                <span className='text-2xl font-bold bg-black text-white rounded-full size-10 flex items-center justify-center'>1</span>
            </div>
            <div className="min-w-0 flex-1">
                <span className="block truncate text-lg font-bold">
                    Nome da equipe
                </span>
                <span className='font-medium text-muted-foreground'>
                    teamxxx
                </span>
                <div className="truncate text-muted-foreground text-sm">
                    <span>#sps20sxxzsd</span>
                    {' · '}
                    <span>4 balões</span>
                </div>
            </div>
            <HugeiconsIcon icon={ChevronDoubleCloseIcon} className='size-8 shrink-0' strokeWidth={2} />
        </div>
    )
}
