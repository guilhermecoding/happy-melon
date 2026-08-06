import { cn } from '@/lib/utils';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

interface BoxFeaturesProps {
    title: string;
    icon: IconSvgElement;
    children: React.ReactNode;
    className?: string;
}

export default function BoxFeatures({
    title,
    icon,
    children,
    className,
}: BoxFeaturesProps) {
    return (
        <div className={cn('w-full flex flex-col border-4 bg-muted border-gray-200 rounded-2xl overflow-hidden relative', className)}>
            <div className='flex items-center gap-2 bg-black text-white px-4 py-2 text-sm font-bold'>
                <HugeiconsIcon
                    icon={icon}
                    className="size-4 shrink-0"
                    strokeWidth={3}
                />
                <span>{title}</span>
            </div>

            {children}
        </div>
    )
}
