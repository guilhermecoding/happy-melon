'use client';

import { useEffect, useState } from 'react';
import {
  mergeTaskSummaries,
  upsertTaskSummary,
  type TaskSummaryDto,
} from '@repo/shared';
import { AppleReminderIcon, KanbanIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Tabs } from '@/components/pouf/disclosure';
import Spinner from '@/components/spinner';
import { balloonService } from '@/services/balloon/balloon.service';
import { getBalloonErrorMessage } from '@/services/balloon/balloon.error';
import { TaskTimelineDialog } from './task-timeline-dialog';
import { TaskHistoryGroupedTable } from './task-history-grouped-table';
import { TaskHistoryKanban } from './task-history-kanban';

const RESYNC_DELAY_MS = 400;

const groupedTabIcon = (
  <HugeiconsIcon
    icon={AppleReminderIcon}
    className="size-4 shrink-0"
    strokeWidth={2}
    aria-hidden
  />
);

const kanbanTabIcon = (
  <HugeiconsIcon
    icon={KanbanIcon}
    className="size-4 shrink-0"
    strokeWidth={2}
    aria-hidden
  />
);

type TaskHistoryDetailProps = {
  roundId: string;
};

export default function TaskHistoryDetail({ roundId }: TaskHistoryDetailProps) {
  const [tasks, setTasks] = useState<TaskSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [tab, setTab] = useState('agrupado');
  const [timelineTask, setTimelineTask] = useState<TaskSummaryDto | null>(null);

  useEffect(() => {
    let active = true;
    let sawOpen = false;
    let sawError = false;
    let resyncTimer = 0;

    setLoading(true);
    setError(undefined);
    setTasks([]);
    setTimelineTask(null);

    async function load(resync: boolean) {
      try {
        const data = await balloonService.listTaskSummaries(roundId);
        if (!active) return;
        setTasks((current) => mergeTaskSummaries(data, current));
        setError(undefined);
        setLoading(false);
      } catch (loadError) {
        if (!active || resync) return;
        setTasks([]);
        setError(
          getBalloonErrorMessage(
            loadError,
            'Não foi possível carregar o histórico.',
          ),
        );
        setLoading(false);
      }
    }

    void load(false);

    const source = new EventSource(
      balloonService.getTaskSummaryEventsUrl(roundId),
      { withCredentials: true },
    );

    source.onmessage = (message) => {
      const event = balloonService.parseTaskSummaryEventData(message.data);
      if (!event || !active) return;
      setTasks((current) => upsertTaskSummary(current, event.task));
      setLoading(false);
    };

    source.onerror = () => {
      sawError = true;
    };

    source.onopen = () => {
      if (sawOpen && sawError) {
        window.clearTimeout(resyncTimer);
        resyncTimer = window.setTimeout(() => {
          void load(true);
        }, RESYNC_DELAY_MS);
      }
      sawOpen = true;
      sawError = false;
    };

    return () => {
      active = false;
      window.clearTimeout(resyncTimer);
      source.close();
    };
  }, [roundId]);

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

  return (
    <>
      <Tabs
        value={tab}
        onChange={setTab}
        tone="purple"
        tabs={[
          {
            value: 'agrupado',
            label: 'Agrupado',
            icon: groupedTabIcon,
            content: (
              <TaskHistoryGroupedTable
                tasks={tasks}
                onOpenTimeline={setTimelineTask}
              />
            ),
          },
          {
            value: 'kanban',
            label: 'Kanban',
            icon: kanbanTabIcon,
            content: (
              <TaskHistoryKanban
                tasks={tasks}
                onOpenTimeline={setTimelineTask}
              />
            ),
          },
        ]}
      />

      <TaskTimelineDialog
        contestId={roundId}
        taskId={timelineTask?.id ?? null}
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
