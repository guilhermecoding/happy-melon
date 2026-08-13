'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import FlipClock from '@/components/8starlabs-ui/flip-clock'
import Image from 'next/image'

type CountdownContestProps = {
    name: string
    startsAt: string
    children: ReactNode
}

function isContestStarted(targetDate: Date) {
    if (Number.isNaN(targetDate.getTime())) return true
    return Date.now() >= targetDate.getTime()
}

export default function CountdownContest({
    name,
    startsAt,
    children,
}: CountdownContestProps) {
    const targetDate = useMemo(() => new Date(startsAt), [startsAt])
    const [ready, setReady] = useState(false)
    const [hasStarted, setHasStarted] = useState(false)

    useEffect(() => {
        const sync = () => {
            const started = isContestStarted(targetDate)
            setHasStarted(started)
            setReady(true)
            return started
        }

        if (sync()) return

        const timer = setInterval(() => {
            if (isContestStarted(targetDate)) {
                setHasStarted(true)
                clearInterval(timer)
            }
        }, 250)

        return () => clearInterval(timer)
    }, [targetDate])

    if (!ready) {
        return null
    }

    if (hasStarted) {
        return (
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4 md:gap-6">
                <h1 className="text-center text-xl font-bold text-muted-foreground md:text-3xl lg:text-4xl">
                    {name}
                </h1>
                <FlipClock
                    variant="default"
                    className="relative text-3xl md:text-5xl lg:text-7xl mt-4"
                    countdown
                    targetDate={targetDate}
                />
                <div className='flex justify-center mt-8'>
                    <Image
                        src="/logo-texto.svg"
                        alt="Logo"
                        width={100}
                        height={100}
                        className="w-60 object-contain grayscale-100 opacity-40 pointer-events-none select-none"
                    />
                </div>
            </div>
        </div>
    )
}
