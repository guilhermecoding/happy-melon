"use client";

import { useEffect, useMemo, useState } from 'react';
import { TASK_KIND } from '@repo/shared';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Attachment01Icon,
  BalloonIcon,
  DocumentAttachmentIcon, ViewIcon
} from '@hugeicons/core-free-icons';
import { BalloonDeliveryStatusIcon } from '@/components/balloon-delivery-status-icon';
import { Button } from '@/components/ui/button';
import { balloonService } from '@/services/balloon/balloon.service';
import { getBalloonErrorMessage } from '@/services/balloon/balloon.error';
import type { TaskHistoryEntry } from '@/services/balloon/balloon.type';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';
import Spinner from '@/components/spinner';
import { Tooltip } from '@/components/pouf/controls';
import { TaskTimelineDialog } from './task-timeline-dialog';
import { Button as ButtonPouf } from '../pouf/Button';

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

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return entries.slice(start, start + PAGE_SIZE);
  }, [entries, currentPage]);

  const rangeStart =
    entries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, entries.length);

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

    return () => {
      active = false;
    };
  }, [contestId, refreshKey]);

  if (loading) {
    return (
      <Spinner />
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
      <div className="flex h-100 flex-col items-center justify-center gap-2">
        <HugeiconsIcon icon={DocumentAttachmentIcon} className="size-14 text-muted-foreground opacity-50" strokeWidth={2} />
        <p className="text-center font-medium text-muted-foreground/80 mt-2">
          Tudo quieto por aqui...
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full min-h-100 flex-col gap-4 px-2 pt-2 pb-2">
        <div className="min-h-0 flex-1 overflow-auto">
          <Table>
            <TableBody>
              {paginatedEntries.map((entry) => {
                const taskId = getStatusChangedTaskId(entry);

                return (
                  <TableRow key={entry.id} className='hover:bg-transparent'>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="w-16 font-semibold tabular-nums text-muted-foreground">
                      {formatHistoryTime(entry.createdAt)}
                    </TableCell>
                    <TableCell className="w-10">
                      <BalloonDeliveryStatusIcon
                        status={entry.status}
                        kind={
                          entry.kind === TASK_KIND.PRINT_TASK
                            ? TASK_KIND.PRINT_TASK
                            : TASK_KIND.BALLOON_TASK
                        }
                      />
                    </TableCell>
                    <TableCell className="flex flex-col gap-1 whitespace-normal text-foreground">
                      {entry.message}.
                      {taskId ? (
                        <span className="text-xs text-muted-foreground">
                          #{taskId}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Tooltip tip="Ver tarefa completa">
                        <Button
                          type="button"
                          variant="normal"
                          size="sm"
                          className="bg-transparent p-1 transition-colors hover:bg-bg"
                          disabled={!taskId}
                          onClick={() => {
                            if (!taskId) return;
                            setTimelineTask({
                              taskId,
                              kind: entry.kind,
                            });
                          }}
                        >
                          <HugeiconsIcon
                            icon={ViewIcon}
                            className="size-4"
                            strokeWidth={2}
                          />
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
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
