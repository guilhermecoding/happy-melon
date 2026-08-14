'use client'

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react'
import {
    CONTEST_ACCESS_EVENT_TYPE,
} from '@repo/shared'
import FlipClock from '@/components/8starlabs-ui/flip-clock'
import { toast } from '@/components/pouf/toaster'
import { contestService } from '@/services/contest/contest.service'
import { getContestCondition } from '@/services/contest/contest.type'
import Image from 'next/image'

type ContestScheduleValue = {
    startsAt: string
    endsAt: string
}

const ContestScheduleContext = createContext<ContestScheduleValue | null>(null)

export function useContestSchedule(): ContestScheduleValue {
    const value = useContext(ContestScheduleContext)
    if (!value) {
        throw new Error('useContestSchedule must be used within CountdownContest')
    }
    return value
}

type CountdownContestProps = {
    contestId: string
    name: string
    startsAt: string
    endsAt: string
    children: ReactNode
}

export default function CountdownContest({
    contestId,
    name: initialName,
    startsAt: initialStartsAt,
    endsAt: initialEndsAt,
    children,
}: CountdownContestProps) {
    const [name, setName] = useState(initialName)
    const [startsAt, setStartsAt] = useState(initialStartsAt)
    const [endsAt, setEndsAt] = useState(initialEndsAt)
    const [nowMs, setNowMs] = useState(() => Date.now())
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setName(initialName)
        setStartsAt(initialStartsAt)
        setEndsAt(initialEndsAt)
    }, [initialName, initialStartsAt, initialEndsAt])

    useEffect(() => {
        setReady(true)
        const timer = window.setInterval(() => setNowMs(Date.now()), 250)
        return () => window.clearInterval(timer)
    }, [])

    useEffect(() => {
        const source = new EventSource(
            contestService.getAccessEventsUrl(contestId),
            { withCredentials: true },
        )

        source.onmessage = (message) => {
            const event = contestService.parseAccessEventData(message.data)
            if (event?.type !== CONTEST_ACCESS_EVENT_TYPE.SCHEDULE_UPDATED) {
                return
            }

            setName(event.name)
            setStartsAt(event.startsAt)
            setEndsAt(event.endsAt)
            toast.info('Os horários da competição foram atualizados.')
        }

        source.onerror = () => {
            // Browser reconnects EventSource automatically.
        }

        return () => {
            source.close()
        }
    }, [contestId])

    const startDate = useMemo(() => new Date(startsAt), [startsAt])
    const condition = getContestCondition(startsAt, endsAt, new Date(nowMs))
    const schedule = useMemo(
        () => ({ startsAt, endsAt }),
        [startsAt, endsAt],
    )

    if (!ready) {
        return null
    }

    if (condition === 'in_progress') {
        return (
            <ContestScheduleContext.Provider value={schedule}>
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            </ContestScheduleContext.Provider>
        )
    }

    return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4 md:gap-6">
                <h1 className="text-center text-xl font-bold text-muted-foreground md:text-3xl lg:text-4xl">
                    {name}
                </h1>
                {condition === 'not_started' ? (
                    <FlipClock
                        variant="default"
                        className="relative text-3xl md:text-5xl lg:text-7xl mt-4"
                        countdown
                        targetDate={startDate}
                    />
                ) : (
                    <p className="text-center text-2xl font-bold md:text-4xl lg:text-5xl">
                        A competição finalizou.
                    </p>
                )}
                <div className="flex justify-center mt-8">
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
