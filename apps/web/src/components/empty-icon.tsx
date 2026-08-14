import { QuillWrite01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';

export default function EmptyIcon({
    className,
}: {
    className?: string;
}) {
    return (
        <HugeiconsIcon icon={QuillWrite01Icon} className={cn("size-5 text-muted-foreground shrink-0 rotate-260", className)} strokeWidth={2} />
    )
}
