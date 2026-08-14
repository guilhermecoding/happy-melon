"use client";

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { ClockIcon, EyeClosedIcon } from '@hugeicons/core-free-icons';
import {
  BALLOON_DELIVERY_STATUS,
  TASK_KIND,
  type TaskKind,
} from '@repo/shared';
import {
  BalloonDeliveryStatusIcon,
  getBalloonDeliveryStatusLabel,
} from '@/components/balloon-delivery-status-icon';
import { Button as ButtonPouf } from '@/components/pouf/Button';
import { Dialog } from '@/components/pouf/controls';
import { RowCard } from '@/components/pouf/surface';
import Spinner from '@/components/spinner';
import { balloonService } from '@/services/balloon/balloon.service';
import { getBalloonErrorMessage } from '@/services/balloon/balloon.error';
import type { TaskHistoryEntry } from '@/services/balloon/balloon.type';
import { getFirstName } from '@/lib/greeting';
import { cn } from '@/lib/utils';

type TaskTimelineDialogProps = {
  contestId: string;
  taskId: string | null;
  kind: TaskKind | string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatTimelineTime(isoDate: string): string {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return '--:--';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatTimelineActorMessage(
  entry: TaskHistoryEntry,
  kind: TaskKind,
): ReactNode {
  if (entry.status === BALLOON_DELIVERY_STATUS.PENDING) {
    return entry.message;
  }

  const firstName = getFirstName(entry.actorName) || entry.actorName;
  const item = kind === TASK_KIND.PRINT_TASK ? 'a impressão' : 'o balão';
  const staff = (
    <>
      {firstName} ({entry.actorUserId})
    </>
  );

  switch (entry.status) {
    case BALLOON_DELIVERY_STATUS.PROCESSING:
      return (
        <>
          {staff} está levando {item} para o time.
        </>
      );
    case BALLOON_DELIVERY_STATUS.DELIVERED:
      return (
        <>
          {staff} entregou {item} ao time.
        </>
      );
    case BALLOON_DELIVERY_STATUS.WITHHELD:
      return (
        <>
          {staff} pegou de volta {item} do time.
        </>
      );
    default:
      return entry.message;
  }
}

export function TaskTimelineDialog({
  contestId,
  taskId,
  kind,
  open,
  onOpenChange,
}: TaskTimelineDialogProps) {
  const [entries, setEntries] = useState<TaskHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!open || !taskId) {
      return;
    }

    let active = true;

    async function loadTimeline() {
      setLoading(true);
      setError(undefined);

      try {
        const data = await balloonService.listTaskTimeline(
          contestId,
          taskId!,
          kind ?? undefined,
        );
        if (active) setEntries(data);
      } catch (loadError) {
        if (active) {
          setEntries([]);
          setError(
            getBalloonErrorMessage(
              loadError,
              'Não foi possível carregar o histórico da tarefa.',
            ),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadTimeline();

    return () => {
      active = false;
    };
  }, [contestId, kind, open, taskId]);

  const taskKind =
    kind === TASK_KIND.PRINT_TASK
      ? TASK_KIND.PRINT_TASK
      : TASK_KIND.BALLOON_TASK;

  // Newest on top; reading bottom → top follows execution order.
  const timeline = useMemo(() => [...entries].reverse(), [entries]);

  const description = taskId ? (
    <>
      Linha do tempo da tarefa <strong>#{taskId}</strong>.
    </>
  ) : (
    'Linha do tempo da tarefa selecionada.'
  );

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Histórico da tarefa"
      description={description}
    >
      <RowCard>
        {loading ? (
          <Spinner />
        ) : error ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        ) : timeline.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            Nenhum evento registrado para esta tarefa.
          </p>
        ) : (
          <ol className="flex flex-col">
            {timeline.map((entry, index) => {
              const isLast = index === timeline.length - 1;

              return (
                <li
                  key={entry.id}
                  className="relative grid grid-cols-[2.5rem_1fr] gap-x-3"
                >
                  <div className="flex flex-col items-center">
                    <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-border bg-background">
                      <BalloonDeliveryStatusIcon
                        status={entry.status}
                        kind={taskKind}
                        className="size-5"
                        strokeWidth={2.5}
                      />
                    </span>
                    <span
                      className={cn(
                        'w-px flex-1 bg-border',
                        isLast ? 'min-h-0 opacity-0' : 'min-h-6',
                      )}
                      aria-hidden
                    />
                  </div>

                  <div className={cn('min-w-0 pb-6', isLast && 'pb-0')}>
                    <div className="flex items-center gap-1">
                      <HugeiconsIcon
                        icon={ClockIcon}
                        className="size-3.5 text-muted-foreground"
                        strokeWidth={2.5}
                      />
                      <p className="text-sm font-semibold tabular-nums text-muted-foreground">
                        {formatTimelineTime(entry.createdAt)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {getBalloonDeliveryStatusLabel(entry.status, taskKind)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatTimelineActorMessage(entry, taskKind)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </RowCard>

      <div className="mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <ButtonPouf variant="quiet" onClick={() => onOpenChange(false)}>
          <HugeiconsIcon
            icon={EyeClosedIcon}
            className="size-5"
            strokeWidth={3}
          />
          Fechar
        </ButtonPouf>
      </div>
    </Dialog>
  );
}
