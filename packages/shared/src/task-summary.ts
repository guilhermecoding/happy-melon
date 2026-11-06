import type { BalloonDeliveryStatus, TaskKind } from './balloon-delivery.js';

export const TASK_SUMMARY_EVENT_TYPE = {
  UPDATED: 'task.summary.updated',
} as const;

export type TaskSummaryEventType =
  (typeof TASK_SUMMARY_EVENT_TYPE)[keyof typeof TASK_SUMMARY_EVENT_TYPE];

export type TaskSummaryDto = {
  id: string;
  kind: TaskKind;
  contestId: string;
  status: BalloonDeliveryStatus;
  updatedAt: string;
  teamName: string;
  teamUsername: string;
  questionLabel: string | null;
  balloonColor: string | null;
  balloonColorLabel: string | null;
  isFirst: boolean;
  responsibleName: string | null;
};

export type TaskSummaryUpdatedEvent = {
  type: typeof TASK_SUMMARY_EVENT_TYPE.UPDATED;
  task: TaskSummaryDto;
};

export function taskSummaryKey(
  task: Pick<TaskSummaryDto, 'kind' | 'id'>,
): string {
  return `${task.kind}:${task.id}`;
}

/** Newest modification first. `id` then `kind` break ties so the order is stable. */
export function compareTaskSummaries(a: TaskSummaryDto, b: TaskSummaryDto): number {
  if (a.updatedAt !== b.updatedAt) {
    return a.updatedAt < b.updatedAt ? 1 : -1;
  }

  if (a.id !== b.id) {
    return a.id < b.id ? 1 : -1;
  }

  if (a.kind !== b.kind) {
    return a.kind < b.kind ? 1 : -1;
  }

  return 0;
}

/** Insert or replace one task without sorting the whole list from scratch. */
export function upsertTaskSummary(
  tasks: readonly TaskSummaryDto[],
  next: TaskSummaryDto,
): TaskSummaryDto[] {
  const key = taskSummaryKey(next);
  const without = tasks.filter((task) => taskSummaryKey(task) !== key);
  const insertAt = without.findIndex(
    (task) => compareTaskSummaries(next, task) <= 0,
  );

  if (insertAt === -1) {
    return [...without, next];
  }

  return [...without.slice(0, insertAt), next, ...without.slice(insertAt)];
}

/**
 * Keep the newer row for each task. Used when a snapshot returns while an SSE
 * event for the same task has already been applied.
 */
export function mergeTaskSummaries(
  snapshot: readonly TaskSummaryDto[],
  overlay: readonly TaskSummaryDto[],
): TaskSummaryDto[] {
  const byKey = new Map<string, TaskSummaryDto>();

  for (const task of snapshot) {
    byKey.set(taskSummaryKey(task), task);
  }

  for (const task of overlay) {
    const key = taskSummaryKey(task);
    const current = byKey.get(key);
    if (!current || compareTaskSummaries(task, current) < 0) {
      byKey.set(key, task);
    }
  }

  return [...byKey.values()].sort(compareTaskSummaries);
}
