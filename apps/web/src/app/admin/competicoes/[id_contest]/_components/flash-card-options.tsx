import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';

interface FlashCardOptionsProps {
    icon: IconSvgElement;
    title: string;
    href: string;
}

export default function FlashCardOptions({ icon, title, href }: FlashCardOptionsProps) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between gap-1 bg-background p-4 rounded-xl border-2 border-black hover:border-border-hover transition-colors duration-300 cursor-pointer"
        >
            <div className="flex items-center gap-1">
                <HugeiconsIcon
                    icon={icon}
                    className="size-6 shrink-0"
                    strokeWidth={2}
                />
                <span className="text-lg font-semibold">{title}</span>
            </div>
            <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-6 shrink-0"
                strokeWidth={2}
            />
        </Link>
    )
}
