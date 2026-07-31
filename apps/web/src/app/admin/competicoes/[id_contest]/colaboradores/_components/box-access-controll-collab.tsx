'use client'

import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

type BoxAccessControllCollabProps = {
    contestId: string
}

export default function BoxAccessControllCollab({
    contestId,
}: BoxAccessControllCollabProps) {
    const [loginUrl, setLoginUrl] = useState('')

    useEffect(() => {
        setLoginUrl(
            `${window.location.origin}/entrar?contest_code=${contestId}`,
        )
    }, [contestId])

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
                                className='size-64'
                            />
                        </div>
                        <span className="text-5xl font-semibold text-primary/70">
                            {contestId}
                        </span>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
