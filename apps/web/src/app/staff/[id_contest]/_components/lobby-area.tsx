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
import { Badge } from '@/components/pouf/media';
import { Card } from '@/components/pouf/surface';
import { cn } from '@/lib/utils';
import {
  getBalloonColorLabel,
  toBalloonColor,
} from '@/services/question/balloon-color';
import {
  Alien02Icon,
  ArrowUp01Icon, AtSignIcon, BadgeInfoIcon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  ComputerIcon,
  Door01Icon,
  UserMultiple02Icon,
  WorkoutRunIcon
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

const TASK_DONE_SOUND_URL = '/sounds/task-done.mp3';

let taskDoneAudio: HTMLAudioElement | undefined;

function playTaskDoneSound() {
  if (!taskDoneAudio) {
    taskDoneAudio = new Audio(TASK_DONE_SOUND_URL);
    taskDoneAudio.preload = 'auto';
  }

  const playback = taskDoneAudio.cloneNode(true) as HTMLAudioElement;
  void playback.play().catch(() => {
    // Deliver must not fail if the browser blocks audio.
  });
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
    return 'Impressão em andamento';
  }

  const color = toBalloonColor(task.balloonColor ?? '');
  const label = getBalloonColorLabel(color).toLowerCase();
  return `Balão ${label} em rota de entrega`;
}

function getTimeoutRemainingPercent(
  claimedAt: string,
  timeoutMinutes: number,
  nowMs: number,
): number {
  const totalMs = timeoutMinutes * 60_000;
  if (totalMs <= 0) return 0;

  const remainingMs = new Date(claimedAt).getTime() + totalMs - nowMs;
  return Math.min(100, Math.max(0, (remainingMs / totalMs) * 100));
}

function getTimeoutBarClass(percent: number): string {
  if (percent > 60) return 'bg-mint';
  if (percent > 40) return 'bg-yellow';
  if (percent > 20) return 'bg-orange';
  return 'bg-red-500';
}

function displayOrDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

type LobbyTaskItemProps = {
  task: StaffTask;
  delivering: boolean;
  nowMs: number;
  deliveryTimeoutMinutes: number | null;
  onDeliver: (task: StaffTask) => void;
  onOpenInfo: (task: StaffTask) => void;
};

function LobbyTaskItem({
  task,
  delivering,
  nowMs,
  deliveryTimeoutMinutes,
  onDeliver,
  onOpenInfo,
}: LobbyTaskItemProps) {
  const isPrint = task.kind === TASK_KIND.PRINT_TASK;
  const balloonColor = toBalloonColor(task.balloonColor ?? '');
  const claimedAt = task.claimedAt;
  const showTimeoutBar =
    deliveryTimeoutMinutes != null && claimedAt != null;
  const remainingPercent =
    showTimeoutBar && deliveryTimeoutMinutes != null && claimedAt
      ? getTimeoutRemainingPercent(claimedAt, deliveryTimeoutMinutes, nowMs)
      : 0;

  return (
    <Card variant="flush">
      <div className="relative overflow-hidden rounded-card">
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
              icon={<HugeiconsIcon icon={BadgeInfoIcon} strokeWidth={2} />}
              label="Detalhes do time"
              onClick={() => onOpenInfo(task)}
            />
            <IconButton
              tone="mint"
              size="sm"
              variant="solid"
              icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} />}
              label="Marcar como entregue"
              disabled={delivering}
              loading={delivering}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                playTaskDoneSound();
                void confetti({
                  zIndex: 9999,
                  origin: {
                    x: (rect.left + rect.width / 2) / window.innerWidth,
                    y: (rect.top + rect.height / 2) / window.innerHeight,
                  },
                });
                onDeliver(task);
              }}
            />
          </div>
        </div>
        {showTimeoutBar ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 overflow-hidden"
            aria-hidden
          >
            <div
              className={cn(
                'h-full transition-[width] duration-1000 ease-linear',
                getTimeoutBarClass(remainingPercent),
              )}
              style={{ width: `${remainingPercent}%` }}
            />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

type LobbyAreaProps = {
  tasks: StaffTask[];
  deliveringIds: Set<string>;
  deliveryTimeoutMinutes: number | null;
  balloonLimit: number | null;
  onDeliver: (task: StaffTask) => void;
};

export default function LobbyArea({
  tasks,
  deliveringIds,
  deliveryTimeoutMinutes,
  balloonLimit,
  onDeliver,
}: LobbyAreaProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [infoTask, setInfoTask] = useState<StaffTask | null>(null);
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const intervalMs = deliveryTimeoutMinutes ? 1_000 : 30_000;
    const id = window.setInterval(() => setNowMs(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [deliveryTimeoutMinutes]);

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
          <div className="flex items-center gap-2">
            {balloonLimit != null ? (
              <div className="mt-1">
                <Badge
                  tone={tasks.length <= balloonLimit ? 'mint' : 'orange'}
                >
                  {tasks.length}/{balloonLimit}
                </Badge>
              </div>
            ) : null}
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
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white px-2 py-4">
          {tasks.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 mt-1 flex flex-col items-center justify-center">
              <HugeiconsIcon icon={Alien02Icon} className="size-8 text-muted-foreground" strokeWidth={2} />
              <p className="px-1 py-2 text-sm text-muted-foreground">
                Buuh! Seu lobby está vazio.
              </p>
            </div>
          ) : null}
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {tasks.map((task) => (
                <motion.div
                  key={`${task.kind}-${task.id}`}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                          opacity: 0,
                          y: -8,
                          scale: 0.97,
                          transition: { duration: 0.18, ease: 'easeIn' },
                        }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0.01 }
                      : { type: 'spring', stiffness: 420, damping: 30, mass: 0.8 }
                  }
                >
                  <LobbyTaskItem
                    task={task}
                    delivering={deliveringIds.has(task.id)}
                    nowMs={nowMs}
                    deliveryTimeoutMinutes={deliveryTimeoutMinutes}
                    onDeliver={onDeliver}
                    onOpenInfo={setInfoTask}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
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
          <dl className="flex flex-col gap-4 text-sm">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={UserMultiple02Icon} className="size-5 text-muted-foreground" strokeWidth={2.5} />
                <dt className="font-semibold text-xl text-muted-foreground">Time</dt>
              </div>
              <dd className="font-bold text-2xl">{infoTask.teamName}</dd>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={AtSignIcon} className="size-5 text-muted-foreground" strokeWidth={2.5} />
                <dt className="font-semibold text-xl text-muted-foreground">Usuário</dt>
              </div>
              <dd className="font-bold text-2xl">{infoTask.teamUsername}</dd>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Door01Icon} className="size-5 text-muted-foreground" strokeWidth={2.5} />
                <dt className="font-semibold text-xl text-muted-foreground">Sala</dt>
              </div>
              <dd className="font-bold text-2xl">{displayOrDash(infoTask.teamRoom)}</dd>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={ComputerIcon} className="size-5 text-muted-foreground" strokeWidth={2.5} />
                <dt className="font-semibold text-xl text-muted-foreground">Máquina</dt>
              </div>
              <dd className="font-bold text-2xl">{displayOrDash(infoTask.teamMachine)}</dd>
            </div>
          </dl>
        ) : null}
      </Dialog>
    </>
  );
}
