import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

export default function TitlePage({
    title,
    icon,
}: {
    title: string;
    icon?: IconSvgElement;
}) {
    return (
        <div className="flex items-start sm:items-center gap-2">
            {icon && <HugeiconsIcon icon={icon} className="size-6 sm:size-8 shrink-0 mt-0.5 sm:mt-0" strokeWidth={2} />}
            <h1 className="text-2xl sm:text-3xl font-bold">{title}</h1>
        </div>
    );
}
