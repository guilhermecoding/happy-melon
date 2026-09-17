'use client';

import { useEffect, useState } from 'react';
import {
  CONTEST_ACCESS_EVENT_TYPE,
  getCompetitionSchedule,
  isScoreFreezeActive,
} from '@repo/shared';
import { SnowIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { Badge } from '@/components/pouf/media';
import { contestService } from '@/services/contest/contest.service';
import type { Contest } from '@/services/contest/contest.type';

type ScoreFreezeNoticeProps = {
  contest: Contest;
};

export default function ScoreFreezeNotice({
  contest: initialContest,
}: ScoreFreezeNoticeProps) {
  const [contest, setContest] = useState(initialContest);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setContest(initialContest);
  }, [initialContest]);

  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 1_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const source = new EventSource(
      contestService.getAccessEventsUrl(contest.id),
      { withCredentials: true },
    );
    let refetchTimer: number | undefined;

    source.onmessage = (message) => {
      const event = contestService.parseAccessEventData(message.data);
      if (
        event?.type !== CONTEST_ACCESS_EVENT_TYPE.SCHEDULE_UPDATED &&
        event?.type !== CONTEST_ACCESS_EVENT_TYPE.ROUND_CHANGED
      ) {
        return;
      }

      window.clearTimeout(refetchTimer);
      refetchTimer = window.setTimeout(() => {
        void contestService.get(contest.id).then((next) => {
          setContest(next);
        });
      }, 50);
    };

    source.onerror = () => {
      // Browser reconnects EventSource automatically.
    };

    return () => {
      window.clearTimeout(refetchTimer);
      source.close();
    };
  }, [contest.id]);

  const currentRound = getCompetitionSchedule(
    contest.rounds,
    new Date(nowMs),
  ).currentRound;

  if (
    !currentRound ||
    !isScoreFreezeActive(currentRound, new Date(nowMs))
  ) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-40">
      <Badge tone="blue">
        <div className="flex items-center gap-1">
          <HugeiconsIcon icon={SnowIcon} className="size-4" strokeWidth={3} />
          <span className="text-sm">Placar Congelado</span>
        </div>
      </Badge>
    </div>
  );
}
