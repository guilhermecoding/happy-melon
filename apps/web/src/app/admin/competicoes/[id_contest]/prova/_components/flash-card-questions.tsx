"use client";

import { ChevronRightIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Balloon } from '@/components/balloon';
import { Card } from '@/components/pouf/surface';

type FlashCardQuestionsProps = {
  label: string;
  title: string;
  balloonColor: string;
  onClick?: () => void;
};

export default function FlashCardQuestions({
  label,
  title,
  balloonColor,
  onClick,
}: FlashCardQuestionsProps) {
  return (
    <Card variant="tight" motion="lift">
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full cursor-pointer flex-row items-center gap-2 text-left outline-none"
      >
        <Balloon color={balloonColor} className="size-7" />

        <div className="flex w-full min-w-0 flex-row items-center justify-between">
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-semibold text-muted-foreground">
              Questão {label}
            </span>
            <span className="truncate text-lg font-bold text-ink">{title}</span>
          </div>
          <HugeiconsIcon
            icon={ChevronRightIcon}
            className="ml-8 size-5 shrink-0"
            strokeWidth={3}
          />
        </div>
      </button>
    </Card>
  );
}
