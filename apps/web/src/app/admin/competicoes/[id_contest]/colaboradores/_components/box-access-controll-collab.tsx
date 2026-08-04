'use client'

import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { contestService } from '@/services/contest/contest.service'
import { getContestErrorMessage } from '@/services/contest/contest.error'
import type { Contest, ContestStatus } from '@/services/contest/contest.type'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/toast'

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
            toast.add({
                title: checked
                    ? 'Acesso dos colaboradores habilitado.'
                    : 'Acesso dos colaboradores desabilitado.',
                type: 'success',
            })
        } catch (error) {
            setContest((current) => ({ ...current, status: previousStatus }))
            const message = getContestErrorMessage(
                error,
                'Não foi possível atualizar o acesso dos colaboradores.',
            )
            toast.add({
                title: message,
                type: 'error',
            })
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="px-4 py-6">
            <div className="flex-1 flex items-center justify-center">
                {loginUrl ? (
                    <div className="flex flex-col gap-4 items-center justify-center">
                        <span className="text-muted-foreground">
                            Compartilhe o código ou o QR Code com os colaboradores
                            para que eles possam acessar a competição.
                        </span>
                        <div className="flex items-center justify-center bg-white p-4 rounded-xl">
                            <QRCodeSVG
                                value={loginUrl}
                                imageSettings={{
                                    src: '/logo-icon.svg',
                                    x: undefined,
                                    y: undefined,
                                    height: 30,
                                    width: 20,
                                    opacity: 1,
                                    excavate: true,
                                }}
                                className='size-52 md:size-64'
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
                                aria-label="Acesso dos colaboradores"
                                onCheckedChange={(checked) =>
                                    void updateAccess(checked)
                                }
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
