'use client'

import { useEffect, useState } from 'react'
import type { Contest } from '@/services/contest/contest.type'
import QRCode from '@/components/ui/qrcode'

type BoxAccessControllCollabProps = {
    contest: Contest
}

export default function BoxAccessControllCollab({
    contest,
}: BoxAccessControllCollabProps) {
    const [loginUrl, setLoginUrl] = useState('')

    useEffect(() => {
        setLoginUrl(
            `${window.location.origin}/entrar?contest_code=${contest.id}`,
        )
    }, [contest.id])

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
                    </div>
                ) : null}
            </div>
        </div>
    )
}
