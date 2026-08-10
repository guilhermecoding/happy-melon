"use client";

import { ChevronDoubleCloseIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Card } from '../pouf/surface';

const RANK_GOLD = '#f8d559';
const RANK_SILVER = '#f6f0ff';
const RANK_BRONZE = '#d0a04e';
const RANK_BLACK = '#3a2e5c';

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
  balloonsTotal?: number;
  onClick?: () => void;
};

export default function FlashCardTeam({
  index,
  name,
  usernameTeam,
  teamId,
  balloonsCount,
  balloonsTotal,
  onClick,
}: FlashCardTeamProps) {
  const rankStyles = getRankStyles(index);
  const balloonsLabel =
    balloonsTotal !== undefined
      ? `${balloonsCount}/${balloonsTotal} balões`
      : balloonsCount === 1
        ? '1 balão'
        : `${balloonsCount} balões`;

  return (
    <Card variant="tight" motion="lift">
      <button
        type="button"
        onClick={onClick}
        className="flex h-full w-full flex-row items-center justify-between gap-4 text-left cursor-pointer outline-none"
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
    </Card>
  );
}
