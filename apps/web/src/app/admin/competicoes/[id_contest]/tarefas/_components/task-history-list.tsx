"use client";

import { useEffect, useState } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  RemoveCircleIcon,
  StatusIcon,
  WorkoutRunIcon,
} from '@hugeicons/core-free-icons';
import {
  BALLOON_DELIVERY_STATUS,
  type BalloonDeliveryStatus,
} from '@repo/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import { balloonService } from '@/services/balloon/balloon.service';
import { getBalloonErrorMessage } from '@/services/balloon/balloon.error';
import type { TaskHistoryEntry } from '@/services/balloon/balloon.type';

type TaskHistoryListProps = {
  contestId: string;
  refreshKey?: number;
};

const STATUS_ICONS = {
  [BALLOON_DELIVERY_STATUS.PENDING]: StatusIcon,
  [BALLOON_DELIVERY_STATUS.PROCESSING]: WorkoutRunIcon,
  [BALLOON_DELIVERY_STATUS.DELIVERED]: CheckmarkCircle02Icon,
  [BALLOON_DELIVERY_STATUS.WITHHELD]: RemoveCircleIcon,
} as const;

function formatHistoryTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '[--:--]';
  }

  const time = new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return `[${time}]`;
}

function iconForStatus(status: BalloonDeliveryStatus) {
  return STATUS_ICONS[status] ?? StatusIcon;
}

export default function TaskHistoryList({
  contestId,
  refreshKey = 0,
}: TaskHistoryListProps) {
  const [entries, setEntries] = useState<TaskHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      setLoading(true);
      setError(undefined);

      try {
        const data = await balloonService.listTaskHistory(contestId);
        if (active) setEntries(data);
      } catch (loadError) {
        if (active) {
          setEntries([]);
          setError(
            getBalloonErrorMessage(
              loadError,
              'Não foi possível carregar o histórico.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, [contestId, refreshKey]);

  if (loading) {
    return (
      <p className="p-4 text-center text-sm text-muted-foreground">
        Carregando histórico...
      </p>
    );
  }

  if (error) {
    return (
      <p role="alert" className="p-4 text-center text-sm text-destructive">
        {error}
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="p-4 text-center text-sm text-muted-foreground">
        Nenhuma tarefa registrada ainda.
      </p>
    );
  }

  return (
    <div className="p-2">
      <Table>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="w-16 text-muted-foreground tabular-nums">
                {formatHistoryTime(entry.createdAt)}
              </TableCell>
              <TableCell className="w-10">
                <HugeiconsIcon
                  icon={iconForStatus(entry.status)}
                  className="size-5 text-foreground"
                  strokeWidth={2}
                />
              </TableCell>
              <TableCell className="whitespace-normal text-foreground">
                {entry.message}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
