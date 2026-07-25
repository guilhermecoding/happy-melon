import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusSignCircleIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import ContestCard from './contest-card';

export default function ContestsPanel() {
    return (
        <div className='flex flex-col gap-4'>
            <div className='flex justify-end'>
                <Button
                    variant='blue'
                    size='sm'
                    className='w-fit'
                >
                    <HugeiconsIcon
                        icon={PlusSignCircleIcon}
                        className='size-5'
                        strokeWidth={3}
                    />
                    Nova Competição
                </Button>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4'>
                <ContestCard
                    name='Maratona Regional de Programação 2026'
                    id='726h2ggg2'
                    status='active'
                    condition='finished'
                    startDate={new Date('2026-07-25')}
                    endDate={new Date('2026-07-25')}
                />
            </div>
        </div>
    )
}
