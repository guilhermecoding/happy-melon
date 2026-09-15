"use client";

import { useState } from 'react';
import { BalloonIcon, HistoryIcon } from '@hugeicons/core-free-icons';
import BoxFeatures from '@/components/box-features';
import BoxTeamsList from './box-teams-list';
import TaskHistoryList from './task-history-list';

type TasksBoardProps = {
  competitionId: string;
  roundId: string;
};

export default function TasksBoard({ competitionId, roundId }: TasksBoardProps) {
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <>
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
    </>
  );
}
