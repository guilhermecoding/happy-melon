import React from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { DateTimeIcon, Flag02Icon, ViewIcon } from '@hugeicons/core-free-icons';
import { formatDateTime } from '@/lib/format-data';
import {
  getContestCondition,
  type Contest,
} from '@/services/contest/contest.type';
import Link from 'next/link';
import { Card } from '@/components/pouf/surface';

type ContestCardProps = Pick<
  Contest,
  'id' | 'name' | 'status' | 'startsAt' | 'endsAt'
>;

const CONDITION_LABELS = {
  not_started: 'Não iniciada',
  in_progress: 'Em andamento',
  finished: 'Finalizada',
} as const;

export default function ContestCard({
  name,
  id,
  status,
  startsAt,
  endsAt,
}: ContestCardProps) {
  const condition = getContestCondition(startsAt, endsAt);
  const finished = condition === 'finished';

  return (
    <div className={finished ? 'opacity-55 grayscale' : undefined}>
      <Card variant="tight" motion="lift">
        <Link
          href={`/admin/competicoes/${id}`}
          className="flex h-full w-full flex-col gap-1 outline-none"
        >
          <h2 className="text-xl font-bold text-ink">{name}</h2>
          <span className="mb-2 text-sm text-muted-foreground">ID: {id}</span>
          <div className="flex items-start gap-2 text-muted-foreground sm:items-center">
            <HugeiconsIcon icon={ViewIcon} className="size-4" strokeWidth={2} />
            <span className="text-sm font-medium">
              {status === 'active' ? 'Habilitada' : 'Desabilitada'}
            </span>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground sm:items-center">
            <HugeiconsIcon icon={Flag02Icon} className="size-4" strokeWidth={2} />
            <span className="text-sm font-medium">{CONDITION_LABELS[condition]}</span>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground sm:items-center">
            <HugeiconsIcon icon={DateTimeIcon} className="size-4" strokeWidth={2} />
            <span className="text-sm font-medium">
              {formatDateTime(new Date(startsAt))} &bull;{' '}
              {formatDateTime(new Date(endsAt))}
            </span>
          </div>
        </Link>
      </Card>
    </div>
  );
}
