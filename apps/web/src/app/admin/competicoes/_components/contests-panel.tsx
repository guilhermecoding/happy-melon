import React from 'react'
import { Button } from '@/components/ui/button'
import { PlusSignCircleIcon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

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
            <div>
                cards
            </div>
        </div>
    )
}
