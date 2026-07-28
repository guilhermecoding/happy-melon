"use client";

import { ChevronDoubleCloseIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cn } from '@/lib/utils';

const RANK_GOLD = '#FFD700';
const RANK_SILVER = '#C0C0C0';
const RANK_BRONZE = '#CD7F32';
const RANK_BLACK = '#000000';

function getRankStyles(index: number) {
  if (index === 1) {
    return { backgroundColor: RANK_GOLD, color: '#000000' };
  }

  if (index === 2) {
    return { backgroundColor: RANK_SILVER, color: '#000000' };
  }

  if (index === 3) {
    return { backgroundColor: RANK_BRONZE, color: '#FFFFFF' };
  }

  return { backgroundColor: RANK_BLACK, color: '#FFFFFF' };
}

type FlashCardTeamProps = {
  index: number;
  name: string;
  usernameTeam: string;
  teamId: string;
  balloonsCount: number;
  onClick?: () => void;
};

export default function FlashCardTeam({
  index,
  name,
  usernameTeam,
  teamId,
  balloonsCount,
  onClick,
}: FlashCardTeamProps) {
  const rankStyles = getRankStyles(index);
  const balloonsLabel =
    balloonsCount === 1 ? '1 balão' : `${balloonsCount} balões`;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-full w-full cursor-pointer flex-row items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 text-left transition-colors',
        'hover:bg-gray-50',
      )}
    >
      <div className="shrink-0">
        <span
          className="flex size-10 items-center justify-center rounded-full text-2xl font-bold"
          style={rankStyles}
        >
          {index}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <span className="block truncate text-lg font-bold">{name}</span>
        <span className="font-medium text-muted-foreground">{usernameTeam}</span>
        <div className="truncate text-sm text-muted-foreground">
          <span>#{teamId}</span>
          {' · '}
          <span>{balloonsLabel}</span>
        </div>
      </div>
      <HugeiconsIcon
        icon={ChevronDoubleCloseIcon}
        className="size-8 shrink-0 rotate-90"
        strokeWidth={2}
      />
    </button>
  );
}
