'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import {
  BALLOON_DELIVERY_STATUS,
  STAFF_TASK_EVENT_TYPE,
  type StaffTask,
  type StaffTaskEvent,
} from '@repo/shared';
import { toast } from '@/components/pouf/toaster';
import { authClient } from '@/lib/auth-client';
import {
  CLAIM_SUCCESS_MESSAGE,
  DELIVER_SUCCESS_MESSAGE,
  staffTasksService,
} from '@/services/staff-tasks/staff-tasks.service';
import LobbyArea from './lobby-area';
import QueueTask from './queue-task';

function sortByCreatedAtAsc(tasks: StaffTask[]): StaffTask[] {
  return [...tasks].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

function upsertTask(tasks: StaffTask[], task: StaffTask): StaffTask[] {
  const without = tasks.filter((item) => item.id !== task.id);
  return sortByCreatedAtAsc([...without, task]);
}

function removeTask(tasks: StaffTask[], taskId: string): StaffTask[] {
  return tasks.filter((item) => item.id !== taskId);
}

type StaffTasksBoardProps = {
  contestId: string;
};

export default function StaffTasksBoard({ contestId }: StaffTasksBoardProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;

  const [queue, setQueue] = useState<StaffTask[]>([]);
  const [lobby, setLobby] = useState<StaffTask[]>([]);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [deliveringIds, setDeliveringIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const snapshot = await staffTasksService.getSnapshot(contestId);
        if (cancelled) return;
        startTransition(() => {
          setQueue(sortByCreatedAtAsc(snapshot.queue));
          setLobby(sortByCreatedAtAsc(snapshot.mine));
        });
      } catch (error) {
        if (cancelled) return;
        toast.error(staffTasksService.getClaimErrorMessage(error));
      }
    }

    const source = new EventSource(
      staffTasksService.getEventsUrl(contestId),
      { withCredentials: true },
    );

    source.onopen = () => {
      void loadSnapshot();
    };

    source.onmessage = (message) => {
      const event = staffTasksService.parseEventData(message.data);
      if (!event) return;
      applyEvent(event);
    };

    source.onerror = () => {
      // Browser reconnects EventSource automatically.
    };

    function applyEvent(event: StaffTaskEvent) {
      const me = userIdRef.current;

      startTransition(() => {
        if (event.type === STAFF_TASK_EVENT_TYPE.QUEUED) {
          setQueue((prev) => upsertTask(prev, event.task));
          setLobby((prev) => removeTask(prev, event.task.id));
          return;
        }

        if (event.type === STAFF_TASK_EVENT_TYPE.CLAIMED) {
          setQueue((prev) => removeTask(prev, event.task.id));
          setLobby((prev) => {
            if (me && event.task.claimedByUserId === me) {
              return upsertTask(prev, event.task);
            }
            return removeTask(prev, event.task.id);
          });
          return;
        }

        if (event.type === STAFF_TASK_EVENT_TYPE.REMOVED) {
          setQueue((prev) => removeTask(prev, event.task.id));
          setLobby((prev) => removeTask(prev, event.task.id));
        }
      });
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
      source.close();
    };
  }, [contestId]);

  async function handleClaim(task: StaffTask) {
    if (!userId || claimingIds.has(task.id)) return;

    const optimistic: StaffTask = {
      ...task,
      status: BALLOON_DELIVERY_STATUS.PROCESSING,
      claimedByUserId: userId,
    };

    setClaimingIds((prev) => new Set(prev).add(task.id));
    setQueue((prev) => removeTask(prev, task.id));
    setLobby((prev) => upsertTask(prev, optimistic));

    try {
      const claimed = await staffTasksService.claim(contestId, task);
      setLobby((prev) => upsertTask(prev, claimed));
      toast.success(CLAIM_SUCCESS_MESSAGE);
    } catch (error) {
      setLobby((prev) => removeTask(prev, task.id));
      if (staffTasksService.isClaimRaceError(error)) {
        // Another staff won the race — keep it out of the queue.
        setQueue((prev) => removeTask(prev, task.id));
      } else {
        setQueue((prev) => upsertTask(prev, task));
      }
      toast.error(staffTasksService.getClaimErrorMessage(error));
    } finally {
      setClaimingIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }

  async function handleDeliver(task: StaffTask) {
    if (deliveringIds.has(task.id)) return;

    setDeliveringIds((prev) => new Set(prev).add(task.id));
    setLobby((prev) => removeTask(prev, task.id));

    try {
      await staffTasksService.deliver(contestId, task);
      toast.success(DELIVER_SUCCESS_MESSAGE);
    } catch (error) {
      setLobby((prev) => upsertTask(prev, task));
      toast.error(staffTasksService.getDeliverErrorMessage(error));
    } finally {
      setDeliveringIds((prev) => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  }

  return (
    <>
      <QueueTask
        tasks={queue}
        claimingIds={claimingIds}
        onClaim={handleClaim}
      />
      <LobbyArea
        tasks={lobby}
        deliveringIds={deliveringIds}
        onDeliver={handleDeliver}
      />
    </>
  );
}
