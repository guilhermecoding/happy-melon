import React from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export default function Logo({
    className,
    ...props
}: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) {
    return (
        <Image
            {...props}
            src="/logo-texto.svg"
            alt="Logo"
            width={100}
            height={100}
            className={cn('object-contain size-8', className)}
        />
    )
}
