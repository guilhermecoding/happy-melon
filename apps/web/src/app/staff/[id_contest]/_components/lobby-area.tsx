'use client';

import {
  TASK_KIND,
  type StaffTask,
} from '@repo/shared';
import { Balloon } from '@/components/balloon';
import PrintIcon from '@/components/print-icon';
import { cn } from '@/lib/utils';
import {
  getBalloonColorLabel,
  toBalloonColor,
} from '@/services/question/balloon-color';
import { WorkoutRunIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

function getTaskSubtitle(task: StaffTask): string {
  if (task.kind === TASK_KIND.PRINT_TASK) {
    return 'Impressão em andamento';
  }

  const color = toBalloonColor(task.balloonColor ?? '');
  const label = getBalloonColorLabel(color).toLowerCase();
  return `Balão ${label} em entrega`;
}

type LobbyAreaProps = {
  tasks: StaffTask[];
};

export default function LobbyArea({ tasks }: LobbyAreaProps) {
  return (
    <div
      className={cn(
        'fixed z-50 flex h-56 w-[min(100%-2rem,22rem)] flex-col gap-3 overflow-hidden rounded-3xl border-4 border-slate-700 bg-slate-700 p-2',
        'bottom-4 left-1/2 -translate-x-1/2',
        'lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0',
      )}
    >
      <div className="flex shrink-0 items-center gap-1 text-white">
        <HugeiconsIcon
          icon={WorkoutRunIcon}
          strokeWidth={2.5}
          className="size-6"
        />
        <span className="font-bold text-xl">Lobby</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl bg-white p-2">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground px-1 py-2">
            Nenhuma tarefa em andamento.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((task) => {
              const isPrint = task.kind === TASK_KIND.PRINT_TASK;
              const balloonColor = toBalloonColor(task.balloonColor ?? '');

              return (
                <li
                  key={`${task.kind}-${task.id}`}
                  className="flex items-center gap-2 rounded-xl px-2 py-2"
                >
                  {isPrint ? (
                    <PrintIcon className="size-7 shrink-0" strokeWidth={1.5} />
                  ) : (
                    <Balloon color={balloonColor} className="size-7 shrink-0" />
                  )}
                  <div className="min-w-0 flex flex-col">
                    <span className="text-sm font-bold truncate">
                      {task.teamName}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {getTaskSubtitle(task)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
