import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

interface BoxFeaturesProps {
    title: string;
    icon: IconSvgElement;
    children: React.ReactNode;
}

export default function BoxFeatures({
    title,
    icon,
    children,
}: BoxFeaturesProps) {
    return (
        <div className='w-full flex flex-col border-4 bg-muted border-gray-200 rounded-2xl overflow-hidden'>
            <div className='flex items-center gap-2 bg-black text-white p-2 text-sm font-bold'>
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
