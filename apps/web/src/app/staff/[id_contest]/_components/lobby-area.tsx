'use client';

import { useEffect, useState } from 'react';
import {
  TASK_KIND,
  type StaffTask,
} from '@repo/shared';
import { Balloon } from '@/components/balloon';
import PrintIcon from '@/components/print-icon';
import { IconButton } from '@/components/pouf/Button';
import { Dialog } from '@/components/pouf/controls';
import { Card } from '@/components/pouf/surface';
import { cn } from '@/lib/utils';
import {
  getBalloonColorLabel,
  toBalloonColor,
} from '@/services/question/balloon-color';
import {
  ArrowUp01Icon, BadgeInfoIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  WorkoutRunIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

function formatRelativeTime(isoDate: string, nowMs: number): string {
  const diffSeconds = Math.round(
    (new Date(isoDate).getTime() - nowMs) / 1000,
  );
  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  const abs = Math.abs(diffSeconds);

  if (abs < 60) {
    return formatter.format(diffSeconds, 'second');
  }
  if (abs < 3600) {
    return formatter.format(Math.round(diffSeconds / 60), 'minute');
  }
  if (abs < 86400) {
    return formatter.format(Math.round(diffSeconds / 3600), 'hour');
  }
  return formatter.format(Math.round(diffSeconds / 86400), 'day');
}

function getTaskSubtitle(task: StaffTask): string {
  if (task.kind === TASK_KIND.PRINT_TASK) {
    return 'Impressão em andamento';
  }

  const color = toBalloonColor(task.balloonColor ?? '');
  const label = getBalloonColorLabel(color).toLowerCase();
  return `Balão ${label} em entrega`;
}

function displayOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

type LobbyTaskItemProps = {
  task: StaffTask;
  delivering: boolean;
  nowMs: number;
  onDeliver: (task: StaffTask) => void;
  onOpenInfo: (task: StaffTask) => void;
};

function LobbyTaskItem({
  task,
  delivering,
  nowMs,
  onDeliver,
  onOpenInfo,
}: LobbyTaskItemProps) {
  const isPrint = task.kind === TASK_KIND.PRINT_TASK;
  const balloonColor = toBalloonColor(task.balloonColor ?? '');

  return (
    <Card variant="flush">
      <div className="flex items-center gap-2 px-3 py-3">
        {isPrint ? (
          <PrintIcon className="size-8 shrink-0" strokeWidth={1.5} />
        ) : (
          <Balloon color={balloonColor} className="size-8 shrink-0" />
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-base font-bold">{task.teamName}</span>
          <span className="truncate text-xs text-muted-foreground">
            {getTaskSubtitle(task)}
          </span>
          <div className="mt-0.5 flex items-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} className="size-3" />
            <span className="text-[11px] text-muted-foreground">
              {formatRelativeTime(task.createdAt, nowMs)}
            </span>
          </div>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <IconButton
            tone="blue"
            size="sm"
            variant="solid"
            icon={<HugeiconsIcon icon={BadgeInfoIcon} />}
            label="Detalhes do time"
            onClick={() => onOpenInfo(task)}
          />
          <IconButton
            tone="mint"
            size="sm"
            variant="solid"
            icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} />}
            label="Marcar como entregue"
            disabled={delivering}
            loading={delivering}
            onClick={() => onDeliver(task)}
          />
        </div>
      </div>
    </Card>
  );
}

type LobbyAreaProps = {
  tasks: StaffTask[];
  deliveringIds: Set<string>;
  onDeliver: (task: StaffTask) => void;
};

export default function LobbyArea({
  tasks,
  deliveringIds,
  onDeliver,
}: LobbyAreaProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [infoTask, setInfoTask] = useState<StaffTask | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <>
      <div
        className={cn(
          'fixed z-50 flex w-[min(100%-2rem,40rem)] flex-col gap-3 overflow-hidden rounded-3xl border-4 border-slate-700 bg-slate-700 p-2 transition-[height] duration-300 ease-out',
          'bottom-4 left-1/2 -translate-x-1/2',
          'lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0',
          expanded ? 'h-[50dvh]' : 'h-48',
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex shrink-0 items-center gap-1 text-white">
            <HugeiconsIcon
              icon={WorkoutRunIcon}
              strokeWidth={2.5}
              className="size-6"
            />
            <span className="font-bold text-xl">Lobby</span>
          </div>
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? 'Reduzir lobby' : 'Expandir lobby'}
            className="mr-2 rounded-lg p-1 transition-colors hover:bg-white/10"
            onClick={() => setExpanded((value) => !value)}
          >
            <HugeiconsIcon
              icon={ArrowUp01Icon}
              className={cn(
                'size-8 text-white transition-transform duration-300 ease-out',
                expanded && 'rotate-180',
              )}
              strokeWidth={2.5}
            />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white px-2 py-4">
          {tasks.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted-foreground">
              Nenhuma tarefa em andamento.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.map((task) => (
                <LobbyTaskItem
                  key={`${task.kind}-${task.id}`}
                  task={task}
                  delivering={deliveringIds.has(task.id)}
                  nowMs={nowMs}
                  onDeliver={onDeliver}
                  onOpenInfo={setInfoTask}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog
        title="Detalhes do time"
        open={infoTask != null}
        onOpenChange={(open) => {
          if (!open) setInfoTask(null);
        }}
      >
        {infoTask ? (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-semibold text-muted-foreground">Time</dt>
            <dd className="font-medium">{infoTask.teamName}</dd>

            <dt className="font-semibold text-muted-foreground">Usuário</dt>
            <dd className="font-medium">{infoTask.teamUsername}</dd>

            <dt className="font-semibold text-muted-foreground">Sala</dt>
            <dd className="font-medium">
              {displayOrDash(infoTask.teamRoom)}
            </dd>

            <dt className="font-semibold text-muted-foreground">Máquina</dt>
            <dd className="font-medium">
              {displayOrDash(infoTask.teamMachine)}
            </dd>
          </dl>
        ) : null}
      </Dialog>
    </>
  );
}
