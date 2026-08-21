'use client'

import { useEffect, useState } from 'react'
import { contestService } from '@/services/contest/contest.service'
import { getContestErrorMessage } from '@/services/contest/contest.error'
import type { Contest, ContestStatus } from '@/services/contest/contest.type'
import { Switch } from '@/components/pouf/controls'
import { toast } from '@/components/pouf/toaster'
import QRCode from '@/components/ui/qrcode'

type BoxAccessControllCollabProps = {
    contest: Contest
}

export default function BoxAccessControllCollab({
    contest: initialContest,
}: BoxAccessControllCollabProps) {
    const [loginUrl, setLoginUrl] = useState('')
    const [contest, setContest] = useState(initialContest)
    const [isUpdating, setIsUpdating] = useState(false)

    useEffect(() => {
        setContest(initialContest)
    }, [initialContest])

    useEffect(() => {
        setLoginUrl(
            `${window.location.origin}/entrar?contest_code=${contest.id}`,
        )
    }, [contest.id])

    async function updateAccess(checked: boolean) {
        const nextStatus: ContestStatus = checked ? 'active' : 'inactive'
        const previousStatus = contest.status

        setContest((current) => ({ ...current, status: nextStatus }))
        setIsUpdating(true)

        try {
            const updatedContest = await contestService.update(contest.id, {
                name: contest.name,
                status: nextStatus,
                startsAt: contest.startsAt,
                endsAt: contest.endsAt,
                venue: contest.venue,
            })
            setContest(updatedContest)
            toast.success(checked
                ? 'Acesso dos colaboradores habilitado.'
                : 'Acesso dos colaboradores desabilitado.')
        } catch (error) {
            setContest((current) => ({ ...current, status: previousStatus }))
            const message = getContestErrorMessage(
                error,
                'Não foi possível atualizar o acesso dos colaboradores.',
            )
            toast.error(message)
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="px-4 py-6">
            <div className="flex-1 flex items-center justify-center">
                {loginUrl ? (
                    <div className="flex w-full min-w-0 flex-col items-center justify-center gap-4">
                        <span className="text-center text-muted-foreground">
                            Compartilhe o código ou o QR Code com os colaboradores
                            para que eles possam acessar a competição.
                        </span>
                        <div className="flex w-full min-w-0 max-w-60 items-center justify-center rounded-xl bg-white p-3 sm:max-w-64 sm:p-4 md:max-w-78">
                            <QRCode
                                value={loginUrl}
                                className="block w-full max-w-full [&_div]:w-full [&_svg]:h-auto [&_svg]:w-full"
                                size={256}
                                logoImage='/logo-icon.svg'
                                logoSize={0.25}
                                dotStyle='rounded'
                                cornerSquareStyle='dot'
                                cornerDotStyle='dot'
                                fgColor='#32345c'
                                level='H'
                            />
                        </div>
                        <span className="text-4xl md:text-5xl font-semibold text-primary/70">
                            {contest.id}
                        </span>
                        <div className="flex flex-row items-center gap-2">
                            <span className="text-muted-foreground">
                                Acesso dos colaboradores:
                            </span>
                            <Switch
                                checked={contest.status === 'active'}
                                disabled={isUpdating}
                                label="Acesso dos colaboradores"
                                onChange={(checked) => void updateAccess(checked)}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
