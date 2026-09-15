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
    getCompetitionSchedule,
} from '@repo/shared'
import FlipClock from '@/components/8starlabs-ui/flip-clock'
import { toast } from '@/components/pouf/toaster'
import { contestService } from '@/services/contest/contest.service'
import type { Contest } from '@/services/contest/contest.type'
import Image from 'next/image'

type ContestScheduleValue = {
    startsAt: string
    endsAt: string
    currentRoundId: string | null
    currentRoundName: string | null
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
    contest: Contest
    children: ReactNode
}

export default function CountdownContest({
    contest: initialContest,
    children,
}: CountdownContestProps) {
    const [contest, setContest] = useState(initialContest)
    const [nowMs, setNowMs] = useState(() => Date.now())
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setContest(initialContest)
    }, [initialContest])

    useEffect(() => {
        setReady(true)
        const timer = window.setInterval(() => setNowMs(Date.now()), 250)
        return () => window.clearInterval(timer)
    }, [])

    useEffect(() => {
        const source = new EventSource(
            contestService.getAccessEventsUrl(contest.id),
            { withCredentials: true },
        )

        source.onmessage = (message) => {
            const event = contestService.parseAccessEventData(message.data)
            if (
                event?.type !== CONTEST_ACCESS_EVENT_TYPE.SCHEDULE_UPDATED &&
                event?.type !== CONTEST_ACCESS_EVENT_TYPE.ROUND_CHANGED
            ) {
                return
            }

            void contestService.get(contest.id).then((next) => {
                setContest(next)
                toast.info('Os horários da competição foram atualizados.')
            })
        }

        source.onerror = () => {
            // Browser reconnects EventSource automatically.
        }

        return () => {
            source.close()
        }
    }, [contest.id])

    const schedule = getCompetitionSchedule(contest.rounds, new Date(nowMs))
    const activeRound = schedule.currentRound ?? schedule.nextRound
    const previousRound = useMemo(() => {
        const now = nowMs
        return [...contest.rounds]
            .filter((round) => new Date(round.endsAt).getTime() <= now)
            .sort(
                (a, b) =>
                    new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime(),
            )
            .at(-1)
    }, [contest.rounds, nowMs])

    const scheduleValue = useMemo(
        () =>
            activeRound
                ? {
                    startsAt: activeRound.startsAt,
                    endsAt: activeRound.endsAt,
                    currentRoundId: schedule.currentRound?.id ?? null,
                    currentRoundName: schedule.currentRound?.name ?? null,
                }
                : {
                    startsAt: contest.rounds[0]?.startsAt ?? new Date().toISOString(),
                    endsAt: contest.rounds[0]?.endsAt ?? new Date().toISOString(),
                    currentRoundId: null,
                    currentRoundName: null,
                },
        [activeRound, contest.rounds, schedule.currentRound],
    )

    if (!ready) {
        return null
    }

    const waiting =
        schedule.condition === 'not_started' ||
        schedule.condition === 'intermission'
    const waitingTarget = schedule.nextRound
        ? new Date(schedule.nextRound.startsAt)
        : null

    return (
        <ContestScheduleContext.Provider value={scheduleValue}>
            {waiting ? (
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex w-full items-center justify-center px-4 py-8">
                        <div className="flex flex-col items-center justify-center gap-4 md:gap-6">
                            <h1 className="text-center text-xl font-bold text-muted-foreground md:text-3xl lg:text-4xl">
                                {contest.name}
                            </h1>
                            {schedule.condition === 'intermission' ? (
                                <p className="text-center text-lg font-semibold md:text-2xl">
                                    {previousRound?.name ?? 'Aquecimento'} encerrado.
                                    {schedule.nextRound
                                        ? ` ${schedule.nextRound.name} começa às ${new Date(schedule.nextRound.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
                                        : null}
                                </p>
                            ) : null}
                            {waitingTarget ? (
                                <FlipClock
                                    variant="default"
                                    className="relative text-3xl md:text-5xl lg:text-7xl mt-4"
                                    countdown
                                    targetDate={waitingTarget}
                                />
                            ) : null}
                            {schedule.condition === 'not_started' ? (
                                <div className="flex justify-center mt-8">
                                    <Image
                                        src="/logo-texto.svg"
                                        alt="Logo"
                                        width={100}
                                        height={100}
                                        className="w-60 object-contain grayscale-100 opacity-40 pointer-events-none select-none"
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                    {schedule.condition === 'intermission' ? (
                        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                    ) : null}
                </div>
            ) : schedule.condition === 'finished' ? (
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex w-full items-center justify-center px-4 py-8">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <h1 className="text-center text-xl font-bold text-muted-foreground md:text-3xl lg:text-4xl">
                                {contest.name}
                            </h1>
                            <p className="text-center text-2xl font-bold md:text-4xl lg:text-5xl">
                                A competição finalizou.
                            </p>
                        </div>
                    </div>
                    <div className="flex min-h-0 flex-1 flex-col">{children}</div>
                </div>
            ) : (
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
            )}
        </ContestScheduleContext.Provider>
    )
}
