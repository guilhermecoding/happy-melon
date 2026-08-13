'use client';

import { useEffect, useState } from 'react';
import {
  TASK_KIND,
  type StaffTask,
} from '@repo/shared';
import { Balloon } from '@/components/balloon';
import PrintIcon from '@/components/print-icon';
import { IconButton } from '@/components/pouf/Button';
import { Blob } from '@/components/pouf/media';
import { Card } from '@/components/pouf/surface';
import {
  getBalloonColorLabel,
  toBalloonColor,
} from '@/services/question/balloon-color';
import { BalloonIcon, Clock01Icon, HandIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';

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
    return 'Solicitou uma impressão!';
  }

  const color = toBalloonColor(task.balloonColor ?? '');
  const label = getBalloonColorLabel(color).toLowerCase();
  return `Levantou um balão ${label}!`;
}

type TaskItemProps = {
  task: StaffTask;
  claiming: boolean;
  claimDisabled: boolean;
  onClaim: (task: StaffTask) => void;
  nowMs: number;
};

function TaskItem({
  task,
  claiming,
  claimDisabled,
  onClaim,
  nowMs,
}: TaskItemProps) {
  const isPrint = task.kind === TASK_KIND.PRINT_TASK;
  const balloonColor = toBalloonColor(task.balloonColor ?? '');

  return (
    <Card variant="flush">
      <div className="flex items-center gap-2 px-5 py-6">
        {isPrint ? (
          <PrintIcon className="size-10" strokeWidth={1.5} />
        ) : (
          <Balloon color={balloonColor} className="size-10" />
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-xl font-bold truncate">{task.teamName}</span>
          <span className="text-sm text-muted-foreground">
            {getTaskSubtitle(task)}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <HugeiconsIcon icon={Clock01Icon} className="size-3" />
            <span className="text-xs text-muted-foreground">
              {formatRelativeTime(task.createdAt, nowMs)}
            </span>
          </div>
        </div>
        <div className="ml-auto shrink-0">
          <IconButton
            tone="mint"
            size="md"
            variant="solid"
            icon={<HugeiconsIcon icon={HandIcon} strokeWidth={2} />}
            label={isPrint ? 'Pegar impressão' : 'Levantar balão'}
            disabled={claiming || claimDisabled}
            loading={claiming}
            onClick={() => onClaim(task)}
          />
        </div>
      </div>
    </Card>
  );
}

type QueueTaskProps = {
  tasks: StaffTask[];
  claimingIds: Set<string>;
  balloonLimit: number | null;
  lobbyCount: number;
  onClaim: (task: StaffTask) => void;
};

export default function QueueTask({
  tasks,
  claimingIds,
  balloonLimit,
  lobbyCount,
  onClaim,
}: QueueTaskProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const claimDisabled =
    balloonLimit != null && lobbyCount >= balloonLimit;

  return (
    <div className="flex w-full flex-col gap-4">
      <Card variant="tight">
        <div className="flex items-center gap-3">
          <Blob
            icon={
              <HugeiconsIcon icon={BalloonIcon} strokeWidth={2.5} />
            }
            size="sm"
            tone="blue"
          />
          <span className="text-xl font-bold">Tarefas</span>
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <Image
              src="/sleep-cat.svg"
              alt="Empty queue"
              width={100}
              height={100}
              className="h-auto w-56 opacity-50"
              loading="eager"
            />
            <p className="text-xl md:text-2xl text-muted-foreground px-1 text-center">
              Tudo tranquilo! Nenhuma tarefa disponível.
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={`${task.kind}-${task.id}`}
              task={task}
              claiming={claimingIds.has(task.id)}
              claimDisabled={claimDisabled}
              onClaim={onClaim}
              nowMs={nowMs}
            />
          ))
        )}
      </div>
    </div>
  );
}
