import { HugeiconsIcon, IconSvgElement } from "@hugeicons/react";
import Link from "next/link";
import { ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Card } from "@/components/pouf/surface";
import { Blob } from "@/components/pouf/media";
import { Tone } from "@/components/pouf/tone";

interface FlashCardOptionsProps {
    icon: IconSvgElement;
    title: string;
    href: string;
    index: number;
}

const blobTones: Tone[] = ['mint', 'blue', 'purple', 'pink', 'yellow'];

export default function FlashCardOptions({ icon, title, href, index }: FlashCardOptionsProps) {
    return (
        <Card variant="flush" motion="tilt-right">
            <Link
                href={href}
                className="flex items-center justify-between gap-1 px-6 pt-4 pb-6 cursor-pointer"
            >
                <div className="flex items-center gap-3">
                    <Blob
                        tone={blobTones[index] ?? 'mint'}
                        size="sm"
                        icon={
                            <HugeiconsIcon
                                icon={icon}
                                className="size-6 shrink-0"
                                strokeWidth={2}
                            />} />
                    <span className="text-lg font-semibold">{title}</span>
                </div>
                <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="size-6 shrink-0"
                    strokeWidth={2}
                />
            </Link>
        </Card>
    )
}
