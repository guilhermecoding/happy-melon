'use client';

import { useEffect, useRef, useState, useTransition, type PointerEvent } from 'react';
import {
  BALLOON_DELIVERY_STATUS,
  STAFF_TASK_EVENT_TYPE,
  type StaffTask,
  type StaffTaskEvent,
} from '@repo/shared';
import { toast } from '@/components/pouf/toaster';
import { authClient } from '@/lib/auth-client';
import {
  getClaimSuccessMessage,
  getDeliverSuccessMessage,
  staffTasksService,
} from '@/services/staff-tasks/staff-tasks.service';
import LobbyArea from './lobby-area';
import MultiTouchBlock from './multi-touch-block';
import QueueTask from './queue-task';
import { useContestSchedule } from '@/app/staff/_components/countdown-contest';

function firstName(fullName: string) {
  const part = fullName.trim().split(/\s+/)[0];
  return part || fullName.trim();
}

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

const MULTI_TOUCH_TAP_COUNT = 8;
const MULTI_TOUCH_WINDOW_MS = 2_000;

function applyRestriction(
  bannedUntil: string | null,
  enabled: boolean,
  restrictedRef: { current: boolean },
) {
  const active =
    enabled &&
    bannedUntil != null &&
    new Date(bannedUntil).getTime() > Date.now();
  restrictedRef.current = active;
  return active ? bannedUntil : null;
}

export default function StaffTasksBoard({ contestId }: StaffTasksBoardProps) {
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id ?? null;
  const { currentRoundId } = useContestSchedule();
  const currentRoundIdRef = useRef(currentRoundId);
  currentRoundIdRef.current = currentRoundId;

  const [queue, setQueue] = useState<StaffTask[]>([]);
  const [lobby, setLobby] = useState<StaffTask[]>([]);
  const [deliveryTimeoutMinutes, setDeliveryTimeoutMinutes] = useState<
    number | null
  >(null);
  const [balloonLimit, setBalloonLimit] = useState<number | null>(null);
  const [multiTouchBanEnabled, setMultiTouchBanEnabled] = useState(false);
  const [multiTouchBanSeconds, setMultiTouchBanSeconds] = useState<
    number | null
  >(null);
  const [bannedUntil, setBannedUntil] = useState<string | null>(null);
  const [blockPending, setBlockPending] = useState(false);
  const [claimingIds, setClaimingIds] = useState<Set<string>>(new Set());
  const [deliveringIds, setDeliveringIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const lobbyRef = useRef(lobby);
  lobbyRef.current = lobby;
  const multiTouchEnabledRef = useRef(multiTouchBanEnabled);
  multiTouchEnabledRef.current = multiTouchBanEnabled;
  const restrictedRef = useRef(false);
  const reportingRef = useRef(false);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshot() {
      try {
        const snapshot = await staffTasksService.getSnapshot(contestId);
        if (cancelled) return;
        startTransition(() => {
          setQueue(sortByCreatedAtAsc(snapshot.queue));
          setLobby(sortByCreatedAtAsc(snapshot.mine));
          setDeliveryTimeoutMinutes(snapshot.deliveryTimeoutMinutes);
          setBalloonLimit(snapshot.balloonLimit);
          setMultiTouchBanEnabled(snapshot.multiTouchBanEnabled);
          setMultiTouchBanSeconds(snapshot.multiTouchBanSeconds);
        });
        multiTouchEnabledRef.current = snapshot.multiTouchBanEnabled;
        if (reportingRef.current && !snapshot.multiTouchBannedUntil) {
          return;
        }
        setBlockPending(false);
        setBannedUntil(
          applyRestriction(
            snapshot.multiTouchBannedUntil,
            snapshot.multiTouchBanEnabled,
            restrictedRef,
          ),
        );
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
      if (event.type === STAFF_TASK_EVENT_TYPE.SETTINGS_UPDATED) {
        setDeliveryTimeoutMinutes(event.deliveryTimeoutMinutes);
        setBalloonLimit(event.balloonLimit);
        multiTouchEnabledRef.current = event.multiTouchBanEnabled;
        setMultiTouchBanEnabled(event.multiTouchBanEnabled);
        setMultiTouchBanSeconds(event.multiTouchBanSeconds);
        if (!event.multiTouchBanEnabled) {
          reportingRef.current = false;
          tapTimesRef.current = [];
          restrictedRef.current = false;
          setBlockPending(false);
          setBannedUntil(null);
        }
        toast.info('Os ajustes da competição foram atualizados.');
        return;
      }

      if (event.type === STAFF_TASK_EVENT_TYPE.MULTI_TOUCH_RESTRICTED) {
        if (
          event.userId !== userIdRef.current ||
          !multiTouchEnabledRef.current
        ) {
          return;
        }
        reportingRef.current = false;
        setBlockPending(false);
        setBannedUntil(
          applyRestriction(event.bannedUntil, true, restrictedRef),
        );
        return;
      }

      const me = userIdRef.current;
      const expiredFromLobby =
        event.type === STAFF_TASK_EVENT_TYPE.QUEUED &&
        lobbyRef.current.some((item) => item.id === event.task.id);

      startTransition(() => {
        if (event.type === STAFF_TASK_EVENT_TYPE.QUEUED) {
          const roundId = currentRoundIdRef.current;
          if (!roundId || event.task.contestId !== roundId) {
            setQueue((prev) => removeTask(prev, event.task.id));
            setLobby((prev) => removeTask(prev, event.task.id));
            return;
          }
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

      if (expiredFromLobby) {
        toast.warning(
          'Uma tarefa expirou por exceder o tempo limite de entrega.',
        );
      }

      if (
        event.type === STAFF_TASK_EVENT_TYPE.CLAIMED &&
        me != null &&
        event.task.claimedByUserId !== me
      ) {
        toast.info(`${firstName(event.claimedByName)} pegou uma tarefa.`);
      }
    }

    void loadSnapshot();

    return () => {
      cancelled = true;
      source.close();
    };
  }, [contestId, currentRoundId]);

  useEffect(() => {
    if (!bannedUntil) return;

    const remaining = new Date(bannedUntil).getTime() - Date.now();
    if (remaining <= 0) {
      restrictedRef.current = false;
      setBannedUntil(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      restrictedRef.current = false;
      setBannedUntil(null);
    }, remaining);

    return () => window.clearTimeout(timeoutId);
  }, [bannedUntil]);

  async function reportMultiTouch() {
    try {
      const result = await staffTasksService.reportMultiTouch(contestId);
      reportingRef.current = false;
      setBlockPending(false);
      if (!multiTouchEnabledRef.current) {
        restrictedRef.current = false;
        setBannedUntil(null);
        return;
      }
      setBannedUntil(
        applyRestriction(result.bannedUntil, true, restrictedRef),
      );
    } catch (error) {
      reportingRef.current = false;
      setBlockPending(false);
      restrictedRef.current = false;
      tapTimesRef.current = [];
      setBannedUntil(null);
      toast.error(staffTasksService.getClaimErrorMessage(error));
    }
  }

  function handleQueuePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (restrictedRef.current || reportingRef.current) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    if (!multiTouchEnabledRef.current) return;

    const now = Date.now();
    const recent = tapTimesRef.current.filter(
      (time) => now - time <= MULTI_TOUCH_WINDOW_MS,
    );
    recent.push(now);
    tapTimesRef.current = recent;

    if (recent.length < MULTI_TOUCH_TAP_COUNT) return;

    event.preventDefault();
    event.stopPropagation();
    tapTimesRef.current = [];
    restrictedRef.current = true;
    reportingRef.current = true;
    setBlockPending(true);
    void reportMultiTouch();
  }

  async function handleClaim(task: StaffTask) {
    if (!userId || claimingIds.has(task.id) || restrictedRef.current) return;
    if (balloonLimit != null && lobby.length >= balloonLimit) return;

    const optimistic: StaffTask = {
      ...task,
      status: BALLOON_DELIVERY_STATUS.PROCESSING,
      claimedByUserId: userId,
      claimedAt: new Date().toISOString(),
    };

    setClaimingIds((prev) => new Set(prev).add(task.id));
    setQueue((prev) => removeTask(prev, task.id));
    setLobby((prev) => upsertTask(prev, optimistic));

    try {
      const claimed = await staffTasksService.claim(contestId, task);
      setLobby((prev) => upsertTask(prev, claimed));
      toast.info(getClaimSuccessMessage());
    } catch (error) {
      setLobby((prev) => removeTask(prev, task.id));
      if (staffTasksService.isClaimRaceError(error)) {
        // Another staff won the race — keep it out of the queue.
        setQueue((prev) => removeTask(prev, task.id));
      } else {
        setQueue((prev) => upsertTask(prev, task));
      }
      if (staffTasksService.isMultiTouchBanError(error)) {
        restrictedRef.current = true;
        void staffTasksService
          .getSnapshot(contestId)
          .then((snapshot) => {
            multiTouchEnabledRef.current = snapshot.multiTouchBanEnabled;
            setMultiTouchBanEnabled(snapshot.multiTouchBanEnabled);
            setMultiTouchBanSeconds(snapshot.multiTouchBanSeconds);
            if (reportingRef.current && !snapshot.multiTouchBannedUntil) return;
            setBlockPending(false);
            setBannedUntil(
              applyRestriction(
                snapshot.multiTouchBannedUntil,
                snapshot.multiTouchBanEnabled,
                restrictedRef,
              ),
            );
          })
          .catch(() => undefined);
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
      toast.success(getDeliverSuccessMessage());
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
        balloonLimit={balloonLimit}
        lobbyCount={lobby.length}
        onClaim={handleClaim}
        onPointerDownCapture={handleQueuePointerDown}
      />
      <LobbyArea
        tasks={lobby}
        deliveringIds={deliveringIds}
        deliveryTimeoutMinutes={deliveryTimeoutMinutes}
        balloonLimit={balloonLimit}
        onDeliver={handleDeliver}
      />
      {bannedUntil || blockPending ? (
        <MultiTouchBlock
          bannedUntil={bannedUntil}
          durationSeconds={multiTouchBanSeconds}
        />
      ) : null}
    </>
  );
}
