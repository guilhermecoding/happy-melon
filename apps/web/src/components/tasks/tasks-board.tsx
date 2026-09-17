"use client";

import { useState } from 'react';
import { BalloonIcon, HistoryIcon } from '@hugeicons/core-free-icons';
import BoxFeatures from '@/components/box-features';
import BoxTeamsList from './box-teams-list';
import RoundSendGuard from './round-send-guard';
import TaskHistoryList from './task-history-list';

type TasksBoardProps = {
  competitionId: string;
  roundId: string;
  startsAt: string;
  endsAt: string;
};

export default function TasksBoard({
  competitionId,
  roundId,
  startsAt,
  endsAt,
}: TasksBoardProps) {
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <RoundSendGuard startsAt={startsAt} endsAt={endsAt}>
      {(canSend) => (
        <div className="flex flex-col gap-4 @5xl:flex-row">
          <div className="w-full lg:w-3/5">
            <BoxFeatures
              title="Times disponíveis"
              icon={BalloonIcon}
              blobSize="sm"
              blobTone="blue"
            >
              <BoxTeamsList
                competitionId={competitionId}
                roundId={roundId}
                canSend={canSend}
                onDeliveryChanged={() => setHistoryKey((current) => current + 1)}
              />
            </BoxFeatures>
          </div>

          <div className="w-full lg:w-2/5">
            <BoxFeatures
              title="Histórico de tarefas"
              icon={HistoryIcon}
              blobSize="sm"
              blobTone="down"
            >
              <TaskHistoryList contestId={roundId} refreshKey={historyKey} />
            </BoxFeatures>
          </div>
        </div>
      )}
    </RoundSendGuard>
  );
}
