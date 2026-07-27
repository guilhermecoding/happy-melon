"use client";

import { ChevronRightIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { IconBalloonFilled } from '@tabler/icons-react';

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
    <button
      type="button"
      onClick={onClick}
      className="bg-background w-full px-4 py-2 flex flex-row items-center gap-2 rounded-2xl border-2 border-black cursor-pointer hover:border-border-hover hover:bg-muted-foreground/10 transition-colors duration-300 text-left"
    >
      <div>
        <IconBalloonFilled
          className="size-7 shrink-0"
          style={{ color: balloonColor }}
        />
      </div>

      <div className="flex flex-row justify-between items-center w-full min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-sm text-muted-foreground font-semibold">
            Questão {label}
          </span>
          <span className="text-lg font-semibold truncate">{title}</span>
        </div>
        <HugeiconsIcon
          icon={ChevronRightIcon}
          className="size-5 shrink-0 ml-8"
          strokeWidth={3}
        />
      </div>
    </button>
  );
}
