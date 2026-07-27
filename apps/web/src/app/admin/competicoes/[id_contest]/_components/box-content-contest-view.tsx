"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BalloonIcon,
  ViewIcon,
  DateTimeIcon,
  EditIcon,
} from '@hugeicons/core-free-icons';
import { formatDateTime } from '@/lib/format-data';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Contest } from '@/services/contest/contest.type';
import { EditContestSheet } from '../../_components/edit-contest-sheet';

type BoxContentContestViewProps = {
  contest: Contest;
};

export default function BoxContentContestView({
  contest: initialContest,
}: BoxContentContestViewProps) {
  const router = useRouter();
  const [contest, setContest] = useState(initialContest);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    setContest(initialContest);
  }, [initialContest]);

  function handleUpdated(updatedContest: Contest) {
    setContest(updatedContest);
    router.refresh();
  }

  return (
    <>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-end">
          <Button
            variant="orange"
            size="sm"
            className="w-fit"
            onClick={() => setEditOpen(true)}
          >
            <HugeiconsIcon
              icon={EditIcon}
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            Editar
          </Button>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-muted-foreground font-medium">
            <HugeiconsIcon
              icon={BalloonIcon}
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            <span>Competição</span>
          </div>
          <span className="text-lg font-bold">{contest.name}</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-muted-foreground font-medium">
            #
            <span>ID</span>
          </div>
          <span className="text-lg font-bold">{contest.id}</span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-muted-foreground font-medium">
            <HugeiconsIcon
              icon={ViewIcon}
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            <span>Status</span>
          </div>
          <span
            className={cn(
              'text-lg font-bold',
              contest.status === 'active' ? 'text-green-500' : 'text-red-500',
            )}
          >
            {contest.status === 'active' ? 'Habilitada' : 'Desabilitada'}
          </span>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1 text-muted-foreground font-medium">
            <HugeiconsIcon
              icon={DateTimeIcon}
              className="size-4 shrink-0"
              strokeWidth={2}
            />
            <span>Período de prova</span>
          </div>
          <span className="text-lg font-bold">
            {formatDateTime(new Date(contest.startsAt))} &bull;{' '}
            {formatDateTime(new Date(contest.endsAt))}
          </span>
        </div>
      </div>

      <EditContestSheet
        contest={contest}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={handleUpdated}
      />
    </>
  );
}
