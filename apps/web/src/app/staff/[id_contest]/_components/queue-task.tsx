'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  TASK_KIND,
  type StaffTask,
} from '@repo/shared';
import { Balloon } from '@/components/balloon';
import PrintIcon from '@/components/print-icon';
import { IconButton } from '@/components/pouf/Button';
import { Badge, Blob } from '@/components/pouf/media';
import { Card } from '@/components/pouf/surface';
import {
  getBalloonColorLabel,
  toBalloonColor,
} from '@/services/question/balloon-color';
import { BalloonIcon, Clock01Icon, ClockFadingIcon, HandIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useContestSchedule } from '@/app/staff/_components/countdown-contest';

function getTaskKey(task: StaffTask): string {
  return `${task.kind}-${task.id}`;
}

function useEnteringTaskKeys(tasks: StaffTask[]): Set<string> {
  const mountedAtRef = useRef<number | null>(null);
  if (mountedAtRef.current === null) {
    mountedAtRef.current = Date.now();
  }

  const seenKeysRef = useRef(new Set<string>());
  const ingestedInitialRef = useRef(false);

  const entering = new Set<string>();
  for (const task of tasks) {
    const key = getTaskKey(task);
    if (seenKeysRef.current.has(key)) continue;

    if (ingestedInitialRef.current) {
      entering.add(key);
      continue;
    }

    if (new Date(task.createdAt).getTime() >= mountedAtRef.current) {
      entering.add(key);
    }
  }

  useLayoutEffect(() => {
    const current = new Set(tasks.map(getTaskKey));
    for (const key of seenKeysRef.current) {
      if (!current.has(key)) seenKeysRef.current.delete(key);
    }
    for (const key of current) {
      seenKeysRef.current.add(key);
    }
    if (tasks.length > 0) {
      ingestedInitialRef.current = true;
    }
  }, [tasks]);

  return entering;
}

function formatCountdown(msRemaining: number): string {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

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
  animateEnter: boolean;
};

function TaskItem({
  task,
  claiming,
  claimDisabled,
  onClaim,
  nowMs,
  animateEnter,
}: TaskItemProps) {
  const reduceMotion = useReducedMotion();
  const isPrint = task.kind === TASK_KIND.PRINT_TASK;
  const balloonColor = toBalloonColor(task.balloonColor ?? '');
  const shouldAnimate = animateEnter && !reduceMotion;
  const transition = reduceMotion
    ? { duration: 0.01 }
    : { type: 'spring' as const, stiffness: 420, damping: 30, mass: 0.8 };

  return (
    <motion.div
      initial={
        shouldAnimate ? { opacity: 0, y: 16, scale: 0.97 } : false
      }
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: -12, scale: 0.97, transition: { duration: 0.18, ease: 'easeIn' } }
      }
      transition={transition}
    >
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
    </motion.div>
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
  const { endsAt } = useContestSchedule();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [countdownNowMs, setCountdownNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setCountdownNowMs(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  const enteringKeys = useEnteringTaskKeys(tasks);
  const claimDisabled =
    balloonLimit != null && lobbyCount >= balloonLimit;

  return (
    <div className="flex w-full flex-col gap-4">
      <Card variant="tight">
        <div className="flex items-center justify-between">
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
          <div>
            <Badge tone="orange">
              <div className="flex items-center gap-1">
                <HugeiconsIcon icon={ClockFadingIcon} className="size-4" strokeWidth={3} />
                <span className="text-sm tabular-nums">
                  {formatCountdown(new Date(endsAt).getTime() - countdownNowMs)}
                </span>
              </div>
            </Badge>
          </div>
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
              className="h-auto w-56 opacity-50 pointer-events-none select-none"
              loading="eager"
            />
            <p className="text-xl md:text-2xl text-muted-foreground px-1 text-center relative -top-18">
              Tudo tranquilo! Nenhuma tarefa disponível.
            </p>
          </div>
        ) : null}
        <AnimatePresence initial={false}>
          {tasks.map((task) => {
            const key = getTaskKey(task);
            return (
              <TaskItem
                key={key}
                task={task}
                claiming={claimingIds.has(task.id)}
                claimDisabled={claimDisabled}
                onClaim={onClaim}
                nowMs={nowMs}
                animateEnter={enteringKeys.has(key)}
              />
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
