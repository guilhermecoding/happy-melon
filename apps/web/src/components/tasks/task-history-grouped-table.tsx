'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  isResolvedBalloonStatus,
  TASK_KIND,
  taskSummaryKey,
  type TaskSummaryDto,
} from '@repo/shared';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Attachment01Icon,
  BadgeInfoIcon,
} from '@hugeicons/core-free-icons';
import { Balloon } from '@/components/balloon';
import {
  getBalloonDeliveryStatusColorClass,
  getBalloonDeliveryStatusIcon,
} from '@/components/balloon-delivery-status-icon';
import { FirstBalloonBadge } from '@/components/first-balloon-badge';
import { Button as ButtonPouf, IconButton } from '@/components/pouf/Button';
import { Card } from '@/components/pouf/surface';
import { Table } from '@/components/pouf/table';
import { toBalloonColor } from '@/services/question/balloon-color';
import { cn } from '@/lib/utils';
import {
  TASK_SUMMARY_PAGE_SIZE,
  formatTaskSummaryTime,
  taskSummaryDescription,
  taskSummaryStatusLabel,
} from './task-summary-format';

type TaskHistoryGroupedTableProps = {
  tasks: TaskSummaryDto[];
  onOpenTimeline: (task: TaskSummaryDto) => void;
};

function showsFirstBadge(task: TaskSummaryDto): boolean {
  return (
    task.kind === TASK_KIND.BALLOON_TASK &&
    task.isFirst &&
    isResolvedBalloonStatus(task.status)
  );
}

function TaskKindMark({ task }: { task: TaskSummaryDto }) {
  if (task.kind === TASK_KIND.PRINT_TASK) {
    return (
      <HugeiconsIcon
        icon={Attachment01Icon}
        className="size-8 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
      />
    );
  }

  return (
    <span className="relative inline-flex">
      <Balloon
        color={toBalloonColor(task.balloonColor ?? '')}
        className="size-8"
      />
      {showsFirstBadge(task) ? <FirstBalloonBadge size="sm" /> : null}
    </span>
  );
}

function TaskStatusCell({ task }: { task: TaskSummaryDto }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold',
        getBalloonDeliveryStatusColorClass(task.status),
      )}
    >
      <HugeiconsIcon
        icon={getBalloonDeliveryStatusIcon(task.status)}
        className="size-4 shrink-0"
        strokeWidth={2}
      />
      {taskSummaryStatusLabel(task.status)}
    </span>
  );
}

export function TaskHistoryGroupedTable({
  tasks,
  onOpenTimeline,
}: TaskHistoryGroupedTableProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(
    1,
    Math.ceil(tasks.length / TASK_SUMMARY_PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageTasks = useMemo(() => {
    const start = (currentPage - 1) * TASK_SUMMARY_PAGE_SIZE;
    return tasks.slice(start, start + TASK_SUMMARY_PAGE_SIZE);
  }, [tasks, currentPage]);

  const rangeStart =
    tasks.length === 0 ? 0 : (currentPage - 1) * TASK_SUMMARY_PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * TASK_SUMMARY_PAGE_SIZE, tasks.length);

  if (tasks.length === 0) {
    return (
      <Card>
        <p className="px-2 py-10 text-center text-sm text-muted-foreground">
          Nenhuma tarefa por aqui.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-4">
        <Table
          rows={pageTasks}
          getKey={taskSummaryKey}
          columns={[
            {
              key: 'kind',
              header: 'Tipo',
              render: (task) => <TaskKindMark task={task} />,
            },
            {
              key: 'description',
              header: 'Descrição',
              clamp: true,
              render: (task) => taskSummaryDescription(task),
            },
            {
              key: 'team',
              header: 'Competidor',
              clamp: true,
              render: (task) => task.teamName,
            },
            {
              key: 'responsible',
              header: 'Responsável',
              clamp: true,
              render: (task) => task.responsibleName ?? '—',
            },
            {
              key: 'status',
              header: 'Último Status',
              render: (task) => <TaskStatusCell task={task} />,
            },
            {
              key: 'time',
              header: 'Horário',
              render: (task) => formatTaskSummaryTime(task.updatedAt),
            },
            {
              key: 'id',
              header: 'ID',
              mono: true,
              render: (task) => task.id,
            },
            {
              key: 'info',
              header: 'Info.',
              render: (task) => (
                <IconButton
                  tone="blue"
                  size="sm"
                  variant="quiet"
                  label="Ver histórico da tarefa"
                  icon={
                    <HugeiconsIcon
                      icon={BadgeInfoIcon}
                      className="size-4"
                      strokeWidth={2}
                    />
                  }
                  onClick={() => onOpenTimeline(task)}
                />
              ),
            },
          ]}
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {rangeStart}–{rangeEnd} de {tasks.length}
            {totalPages > 1
              ? ` · Página ${currentPage} de ${totalPages}`
              : null}
          </p>
          <div className="flex items-center gap-2">
            <ButtonPouf
              variant="quiet"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                className="size-4"
                strokeWidth={2}
              />
              Anterior
            </ButtonPouf>
            <ButtonPouf
              type="button"
              variant="quiet"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
            >
              Próxima
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className="size-4"
                strokeWidth={2}
              />
            </ButtonPouf>
          </div>
        </div>
      </div>
    </Card>
  );
}
