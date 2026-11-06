'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import {
  BALLOON_DELIVERY_STATUS,
  isResolvedBalloonStatus,
  TASK_KIND,
  taskSummaryKey,
  type BalloonDeliveryStatus,
  type TaskSummaryDto,
} from '@repo/shared';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  BadgeInfoIcon,
  Clock01Icon,
  LookTopIcon,
} from '@hugeicons/core-free-icons';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from 'motion/react';
import { Balloon } from '@/components/balloon';
import {
  getBalloonDeliveryStatusColorClass,
  getBalloonDeliveryStatusIcon,
} from '@/components/balloon-delivery-status-icon';
import { FirstBalloonBadge } from '@/components/first-balloon-badge';
import PrintIcon from '@/components/print-icon';
import { IconButton } from '@/components/pouf/Button';
import { Card } from '@/components/pouf/surface';
import { toBalloonColor } from '@/services/question/balloon-color';
import { cn } from '@/lib/utils';
import {
  TASK_SUMMARY_PAGE_SIZE,
  formatTaskSummaryTime,
} from './task-summary-format';

type TaskHistoryKanbanProps = {
  tasks: TaskSummaryDto[];
  onOpenTimeline: (task: TaskSummaryDto) => void;
};

type ColumnId = 'available' | 'route' | 'delivered';

const COLUMNS: Array<{
  id: ColumnId;
  title: string;
  status: BalloonDeliveryStatus;
  match: (status: BalloonDeliveryStatus) => boolean;
}> = [
    {
      id: 'available',
      title: 'Disponível',
      status: BALLOON_DELIVERY_STATUS.PENDING,
      match: (status) =>
        status === BALLOON_DELIVERY_STATUS.PENDING ||
        status === BALLOON_DELIVERY_STATUS.WITHHELD,
    },
    {
      id: 'route',
      title: 'Em rota',
      status: BALLOON_DELIVERY_STATUS.PROCESSING,
      match: (status) => status === BALLOON_DELIVERY_STATUS.PROCESSING,
    },
    {
      id: 'delivered',
      title: 'Entregue',
      status: BALLOON_DELIVERY_STATUS.DELIVERED,
      match: (status) => status === BALLOON_DELIVERY_STATUS.DELIVERED,
    },
  ];

function useVisibleOnScrollCount(
  itemCount: number,
  sentinelRef: RefObject<HTMLDivElement | null>,
  rootRef: RefObject<HTMLDivElement | null>,
) {
  const [visibleCount, setVisibleCount] = useState(TASK_SUMMARY_PAGE_SIZE);
  const count = Math.min(visibleCount, itemCount);

  useEffect(() => {
    const node = sentinelRef.current;
    const root = rootRef.current;
    if (!node || !root || count >= itemCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setVisibleCount((current) => current + TASK_SUMMARY_PAGE_SIZE);
      },
      { root, rootMargin: '160px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [count, itemCount, rootRef, sentinelRef]);

  return count;
}

function showsFirstBadge(task: TaskSummaryDto): boolean {
  return (
    task.kind === TASK_KIND.BALLOON_TASK &&
    task.isFirst &&
    isResolvedBalloonStatus(task.status)
  );
}

function useEnteringSummaryKeys(tasks: readonly TaskSummaryDto[]): Set<string> {
  const seenRef = useRef(new Set<string>());
  const ingestedRef = useRef(false);
  const entering = new Set<string>();

  if (ingestedRef.current) {
    for (const task of tasks) {
      const key = taskSummaryKey(task);
      if (!seenRef.current.has(key)) {
        entering.add(key);
      }
    }
  }

  useLayoutEffect(() => {
    if (!ingestedRef.current) {
      if (tasks.length === 0) return;
      for (const task of tasks) {
        seenRef.current.add(taskSummaryKey(task));
      }
      ingestedRef.current = true;
      return;
    }

    for (const task of tasks) {
      seenRef.current.add(taskSummaryKey(task));
    }
  }, [tasks]);

  return entering;
}

function EmptyTask() {
  return (
    <div className="py-6 text-center text-sm text-muted-foreground mt-8 lg:mt-32">
      <HugeiconsIcon icon={LookTopIcon} className="size-14" />
      <p className="mt-2 text-lg">Nada aqui, por enquanto.</p>
    </div>
  );
}

function KanbanCardBody({
  task,
  onOpenTimeline,
}: {
  task: TaskSummaryDto;
  onOpenTimeline: (task: TaskSummaryDto) => void;
}) {
  const isPrint = task.kind === TASK_KIND.PRINT_TASK;

  return (
    <Card variant="flush">
      <div className="flex items-center gap-2 px-5 py-6">
        {isPrint ? (
          <PrintIcon className="size-10 shrink-0" strokeWidth={1.5} />
        ) : (
          <span className="relative shrink-0">
            <Balloon
              color={toBalloonColor(task.balloonColor ?? '')}
              className="size-10"
            />
            {showsFirstBadge(task) ? <FirstBalloonBadge size="sm" /> : null}
          </span>
        )}
        <div className="flex min-w-0 flex-col">
          <span className="line-clamp-2 text-xl font-bold wrap-anywhere">
            {task.teamName}
          </span>
          <span className="truncate text-sm text-muted-foreground">
            {task.teamUsername}
          </span>
          {task.responsibleName ? (
            <span className="line-clamp-2 text-sm text-muted-foreground wrap-anywhere">
              Tarefa feita por{' '}
              <span className="font-bold text-ink">{task.responsibleName}</span>
            </span>
          ) : null}
          <div className="mt-1 flex items-center gap-1">
            <HugeiconsIcon icon={Clock01Icon} className="size-3" />
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTaskSummaryTime(task.updatedAt)}
            </span>
          </div>
        </div>
        <div className="ml-auto shrink-0">
          <IconButton
            tone="blue"
            size="md"
            variant="quiet"
            label="Ver histórico da tarefa"
            icon={<HugeiconsIcon icon={BadgeInfoIcon} strokeWidth={2} />}
            onClick={() => onOpenTimeline(task)}
          />
        </div>
      </div>
    </Card>
  );
}

function KanbanColumn({
  title,
  status,
  tasks,
  enteringKeys,
  onOpenTimeline,
}: {
  title: string;
  status: BalloonDeliveryStatus;
  tasks: TaskSummaryDto[];
  enteringKeys: Set<string>;
  onOpenTimeline: (task: TaskSummaryDto) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const visibleCount = useVisibleOnScrollCount(
    tasks.length,
    sentinelRef,
    scrollRef,
  );
  const visibleTasks = useMemo(
    () => tasks.slice(0, visibleCount),
    [tasks, visibleCount],
  );

  const reduceMotion = useReducedMotion();

  return (
    <Card variant="tight" shadow="inset">
      <div className="flex h-full max-h-[calc(100dvh-18rem)] min-h-80 flex-col gap-4">
        <div
          className={cn(
            'flex shrink-0 items-center gap-2',
            getBalloonDeliveryStatusColorClass(status),
          )}
        >
          <HugeiconsIcon
            icon={getBalloonDeliveryStatusIcon(status)}
            className="size-5 shrink-0"
            strokeWidth={2}
          />
          <h2 className="text-lg font-bold">{title}</h2>
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-current/15 px-2 text-xs font-bold tabular-nums">
            {tasks.length}
          </span>
        </div>

        <div
          ref={scrollRef}
          className="-mx-(--s4) flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pt-4 pb-6 md:pb-28 scrollbar-gutter-stable"
        >
          <AnimatePresence initial={false} mode="popLayout">
            {visibleTasks.map((task) => {
              const key = taskSummaryKey(task);
              const animateEnter = enteringKeys.has(key);
              return (
                <motion.div
                  key={key}
                  layout={reduceMotion ? false : 'position'}
                  layoutId={reduceMotion ? undefined : key}
                  initial={
                    animateEnter && !reduceMotion
                      ? { opacity: 0, y: 12 }
                      : false
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    reduceMotion
                      ? { opacity: 0 }
                      : {
                        opacity: 0,
                        scale: 0.98,
                        transition: { duration: 0.15 },
                      }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0.01 }
                      : {
                        type: 'spring',
                        stiffness: 420,
                        damping: 34,
                        mass: 0.8,
                      }
                  }
                >
                  <KanbanCardBody task={task} onOpenTimeline={onOpenTimeline} />
                </motion.div>
              );
            })}
          </AnimatePresence>

          {visibleCount < tasks.length ? (
            <div ref={sentinelRef} className="h-px" aria-hidden />
          ) : null}

          {tasks.length === 0 ? <EmptyTask /> : null}
        </div>
      </div>
    </Card>
  );
}

export function TaskHistoryKanban({
  tasks,
  onOpenTimeline,
}: TaskHistoryKanbanProps) {
  const enteringKeys = useEnteringSummaryKeys(tasks);
  const columns = useMemo(
    () =>
      COLUMNS.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => column.match(task.status)),
      })),
    [tasks],
  );

  return (
    <LayoutGroup>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            title={column.title}
            status={column.status}
            tasks={column.tasks}
            enteringKeys={enteringKeys}
            onOpenTimeline={onOpenTimeline}
          />
        ))}
      </div>
    </LayoutGroup>
  );
}
