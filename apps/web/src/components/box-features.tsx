import { cn } from '@/lib/utils';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { Card } from './pouf/surface';
import { Blob } from './pouf/media';
import { ComponentPropsWithoutRef } from 'react';

interface BoxFeaturesProps {
    title: string;
    icon: IconSvgElement;
    iconSize?: ComponentPropsWithoutRef<typeof HugeiconsIcon>['size'];
    iconStrokeWidth?: ComponentPropsWithoutRef<typeof HugeiconsIcon>['strokeWidth'];
    children: React.ReactNode;
    blobTone?: ComponentPropsWithoutRef<typeof Blob>['tone'];
    blobSize?: ComponentPropsWithoutRef<typeof Blob>['size'];
}

export default function BoxFeatures({
    title,
    icon,
    iconSize,
    iconStrokeWidth = 3,
    children,
    blobTone,
    blobSize,
}: BoxFeaturesProps) {
    return (
        <Card>
            <div className='flex w-full shrink-0 items-center gap-3 px-4 py-2 text-sm font-bold text-white'>
                <Blob
                    icon={<HugeiconsIcon
                        icon={icon}
                        className={cn("size-4 shrink-0", iconSize)}
                        strokeWidth={iconStrokeWidth}
                    />}
                    tone={blobTone}
                    size={blobSize}
                />
                <span className='text-xl font-bold text-ink'>{title}</span>
            </div>

            <div className='flex min-h-0 flex-1 flex-col'>
                {children}
            </div>
        </Card>
    )
}
