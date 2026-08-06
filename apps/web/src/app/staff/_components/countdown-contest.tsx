import FlipClock from '@/components/8starlabs-ui/flip-clock'
import React from 'react'

export default function CountdownContest() {
    return (
        <div className='w-full h-screen flex items-center justify-center relative'>
            <FlipClock
                variant="default"
                className='relative -top-1/5'
                countdown
            />
        </div>
    )
}
