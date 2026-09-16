'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { getContestCondition } from '@/services/contest/contest.type';

const TICK_MS = 15_000;

type RoundSendGuardProps = {
  startsAt: string;
  endsAt: string;
  children: (canSend: boolean) => ReactNode;
};

function useCanSendTasks(startsAt: string, endsAt: string) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), TICK_MS);
    return () => clearInterval(id);
  }, [startsAt, endsAt]);

  return getContestCondition(startsAt, endsAt, now) === 'in_progress';
}

export default function RoundSendGuard({
  startsAt,
  endsAt,
  children,
}: RoundSendGuardProps) {
  const canSend = useCanSendTasks(startsAt, endsAt);

  return (
    <>
      {!canSend ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3"
        >
          <HugeiconsIcon
            icon={Alert02Icon}
            className="size-6 shrink-0 text-amber-600"
            strokeWidth={2}
          />
          <p className="text-sm font-medium text-foreground">
            Não é possível enviar tasks fora do horário da rodada.
          </p>
        </div>
      ) : null}
      {children(canSend)}
    </>
  );
}
