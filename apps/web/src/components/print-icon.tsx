import { HugeiconsIcon } from '@hugeicons/react';
import { DocumentAttachmentIcon } from '@hugeicons/core-free-icons';

export default function PrintIcon({
    className,
    strokeWidth = 1.5,
}: {
    className?: string;
    strokeWidth?: number;
}) {
    return (
        <HugeiconsIcon icon={DocumentAttachmentIcon} className={className} strokeWidth={strokeWidth} />
    )
}
