'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getCompetitionSchedule } from '@repo/shared';
import { PlayIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Select } from '@/components/pouf/controls';
import type { Contest, ContestRound } from '@/services/contest/contest.type';

function highlightsRunningRound(pathname: string): boolean {
  return (
    pathname.endsWith('/tarefas') || pathname.endsWith('/tarefas/historico')
  );
}

function useRunningRoundId(
  rounds: ContestRound[],
  fallbackId: string | null,
  enabled: boolean,
): string | null {
  const [runningRoundId, setRunningRoundId] = useState(fallbackId);

  useEffect(() => {
    if (!enabled) return;

    let timer = 0;

    function sync() {
      const schedule = getCompetitionSchedule(rounds);
      const nextId = schedule.currentRound?.id ?? null;
      setRunningRoundId((current) => (current === nextId ? current : nextId));

      const boundary =
        schedule.currentRound?.endsAt ?? schedule.nextRound?.startsAt;
      if (!boundary) return;

      const delay = new Date(boundary).getTime() - Date.now();
      if (delay <= 0) return;
      timer = window.setTimeout(sync, Math.min(delay + 250, 2_147_483_647));
    }

    sync();
    return () => window.clearTimeout(timer);
  }, [enabled, rounds]);

  return enabled ? runningRoundId : null;
}

function RoundOptionLabel({
  name,
  running,
}: {
  name: string;
  running: boolean;
}) {
  if (!running) return name;

  return (
    <span className="inline-flex max-w-full items-center gap-2 text-green-600 font-bold in-data-[state=checked]:text-white">
      <HugeiconsIcon
        icon={PlayIcon}
        className="size-4 shrink-0"
        strokeWidth={2.5}
        aria-hidden
      />
      <span className="min-w-0">{name}</span>
    </span>
  );
}

type RoundSwitcherProps = {
  contest: Contest;
  selectedRoundId: string;
  alwaysShow?: boolean;
};

export default function RoundSwitcher({
  contest,
  selectedRoundId,
  alwaysShow = false,
}: RoundSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const highlightRunning = highlightsRunningRound(pathname);
  const runningRoundId = useRunningRoundId(
    contest.rounds,
    contest.currentRound?.id ?? null,
    highlightRunning,
  );

  if (contest.rounds.length === 0) {
    return null;
  }

  if (!alwaysShow && contest.rounds.length <= 1) {
    return null;
  }

  const options = contest.rounds.map((round) => ({
    value: round.id,
    label: (
      <RoundOptionLabel
        name={round.name}
        running={round.id === runningRoundId}
      />
    ),
  }));

  return (
    <div className="mb-4 max-w-sm">
      <Select
        value={selectedRoundId}
        options={options}
        onChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('round', value);
          router.replace(`${pathname}?${params.toString()}`);
        }}
      />
    </div>
  );
}
