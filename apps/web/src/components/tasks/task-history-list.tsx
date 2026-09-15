"use client";

import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { BALLOON_DELIVERY_STATUS, TASK_KIND } from '@repo/shared';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Attachment01Icon,
  BalloonIcon,
  DocumentAttachmentIcon,
  ViewIcon,
} from '@hugeicons/core-free-icons';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { BalloonDeliveryStatusIcon } from '@/components/balloon-delivery-status-icon';
import { balloonService } from '@/services/balloon/balloon.service';
import { getBalloonErrorMessage } from '@/services/balloon/balloon.error';
import type { TaskHistoryEntry } from '@/services/balloon/balloon.type';
import Spinner from '@/components/spinner';
import { Tooltip } from '@/components/pouf/controls';
import { TaskTimelineDialog } from './task-timeline-dialog';
import { Button as ButtonPouf } from '../../../../../../components/pouf/Button';

type TaskHistoryListProps = {
  contestId: string;
  refreshKey?: number;
};

const PAGE_SIZE = 10;

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

function getStatusChangedTaskId(entry: TaskHistoryEntry): string | null {
  return entry.taskId ?? entry.printTaskId ?? entry.balloonDeliveryId;
}

function formatHistoryMessage(entry: TaskHistoryEntry): string {
  if (entry.status !== BALLOON_DELIVERY_STATUS.PROCESSING) {
    return entry.message;
  }

  return entry.message.replace(/\bem entrega\b/g, 'em rota de entrega');
}

/** Marks only ids that appear after the initial history load (e.g. SSE). */
function useEnteringHistoryIds(
  entries: TaskHistoryEntry[],
  resetKey: string,
): Set<string> {
  const mountedAtRef = useRef<number | null>(null);
  const seenIdsRef = useRef(new Set<string>());
  const ingestedInitialRef = useRef(false);
  const prevResetKeyRef = useRef(resetKey);

  if (prevResetKeyRef.current !== resetKey) {
    prevResetKeyRef.current = resetKey;
    mountedAtRef.current = Date.now();
    seenIdsRef.current = new Set();
    ingestedInitialRef.current = false;
  }

  if (mountedAtRef.current === null) {
    mountedAtRef.current = Date.now();
  }

  const entering = new Set<string>();
  for (const entry of entries) {
    if (seenIdsRef.current.has(entry.id)) continue;

    if (ingestedInitialRef.current) {
      entering.add(entry.id);
      continue;
    }

    if (new Date(entry.createdAt).getTime() >= mountedAtRef.current) {
      entering.add(entry.id);
    }
  }

  useLayoutEffect(() => {
    const current = new Set(entries.map((entry) => entry.id));
    for (const id of seenIdsRef.current) {
      if (!current.has(id)) seenIdsRef.current.delete(id);
    }
    for (const id of current) {
      seenIdsRef.current.add(id);
    }
    if (entries.length > 0) {
      ingestedInitialRef.current = true;
    }
  }, [entries]);

  return entering;
}

type HistoryRowProps = {
  entry: TaskHistoryEntry;
  animateEnter: boolean;
  onOpenTimeline: (taskId: string, kind: string) => void;
};

const HistoryRow = memo(function HistoryRow({
  entry,
  animateEnter,
  onOpenTimeline,
}: HistoryRowProps) {
  const reduceMotion = useReducedMotion();
  const shouldAnimate = animateEnter && !reduceMotion;
  const taskId = getStatusChangedTaskId(entry);

  return (
    <motion.div
      className="px-2 py-3"
      style={{ transformOrigin: 'center center' }}
      initial={
        shouldAnimate
          ? { opacity: 0, scale: 0.72 }
          : false
      }
      animate={{ opacity: 1, scale: 1 }}
      transition={
        reduceMotion
          ? { duration: 0.01 }
          : { type: 'spring', stiffness: 420, damping: 28, mass: 0.7 }
      }
    >
      <div className="flex items-center gap-3">
        {entry.kind === TASK_KIND.PRINT_TASK ? (
          <HugeiconsIcon
            icon={Attachment01Icon}
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={2}
          />
        ) : (
          <HugeiconsIcon
            icon={BalloonIcon}
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={2}
            fill="currentColor"
          />
        )}

        <span className="w-16 shrink-0 text-sm font-semibold tabular-nums text-muted-foreground">
          {formatHistoryTime(entry.createdAt)}
        </span>

        <BalloonDeliveryStatusIcon
          status={entry.status}
          kind={
            entry.kind === TASK_KIND.PRINT_TASK
              ? TASK_KIND.PRINT_TASK
              : TASK_KIND.BALLOON_TASK
          }
          className="shrink-0"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-semibold text-ink">
            {formatHistoryMessage(entry)}.
          </span>
          {taskId ? (
            <span className="text-xs text-muted-foreground">#{taskId}</span>
          ) : null}
        </div>

        <Tooltip tip="Ver tarefa completa">
          <button
            type="button"
            title=""
            disabled={!taskId}
            onClick={() => {
              if (!taskId) return;
              onOpenTimeline(taskId, entry.kind);
            }}
            className="flex shrink-0 cursor-pointer items-center justify-center rounded-full p-2 transition-colors hover:bg-ink/10"
          >
            <HugeiconsIcon icon={ViewIcon} className="size-4" strokeWidth={2} />
          </button>
        </Tooltip>
      </div>
    </motion.div>
  );
});

export default function TaskHistoryList({
  contestId,
  refreshKey = 0,
}: TaskHistoryListProps) {
  const [entries, setEntries] = useState<TaskHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [page, setPage] = useState(1);
  const [timelineTask, setTimelineTask] = useState<{
    taskId: string;
    kind: string;
  } | null>(null);

  const resetKey = `${contestId}:${refreshKey}`;
  const enteringIds = useEnteringHistoryIds(entries, resetKey);

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }, [entries, currentPage]);

  const rangeStart =
    entries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, entries.length);

  const handleOpenTimeline = useCallback((taskId: string, kind: string) => {
    setTimelineTask({ taskId, kind });
  }, []);

  useEffect(() => {
    setPage(1);
  }, [contestId, refreshKey]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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

    const source = new EventSource(
      balloonService.getTaskHistoryEventsUrl(contestId),
      { withCredentials: true },
    );

    source.onmessage = (message) => {
      const event = balloonService.parseTaskHistoryEventData(message.data);
      if (!event) return;

      setEntries((current) => {
        const without = current.filter((item) => item.id !== event.entry.id);
        return [event.entry, ...without];
      });
    };

    source.onerror = () => {
      // Browser reconnects EventSource automatically.
    };

    return () => {
      active = false;
      source.close();
    };
  }, [contestId, refreshKey]);

  if (loading) {
    return <Spinner />;
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
      <div className="flex h-100 flex-col items-center justify-center gap-2">
        <HugeiconsIcon
          icon={DocumentAttachmentIcon}
          className="size-14 text-muted-foreground opacity-50"
          strokeWidth={2}
        />
        <p className="mt-2 text-center font-medium text-muted-foreground/80">
          Tudo quieto por aqui...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full min-h-100 flex-col gap-4 px-2 pt-2 pb-2">
        <div className="min-h-0 flex-1 divide-y divide-ink/10 overflow-auto">
          <AnimatePresence initial={false}>
            {paginatedEntries.map((entry) => (
              <HistoryRow
                key={entry.id}
                entry={entry}
                animateEnter={enteringIds.has(entry.id)}
                onOpenTimeline={handleOpenTimeline}
              />
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {rangeStart}–{rangeEnd} de {entries.length}
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

      <TaskTimelineDialog
        contestId={contestId}
        taskId={timelineTask?.taskId ?? null}
        kind={timelineTask?.kind ?? null}
        open={Boolean(timelineTask)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setTimelineTask(null);
          }
        }}
      />
    </>
  );
}
