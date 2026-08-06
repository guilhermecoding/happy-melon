"use client";

import { useState } from 'react';
import { BalloonIcon, HistoryIcon } from '@hugeicons/core-free-icons';
import BoxFeatures from '@/components/box-features';
import BoxTeamsList from './box-teams-list';
import TaskHistoryList from './task-history-list';

type TasksBoardProps = {
  contestId: string;
};

export default function TasksBoard({ contestId }: TasksBoardProps) {
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <>
      <BoxFeatures
        title="Times disponíveis"
        icon={BalloonIcon}
        blobSize="sm"
        blobTone="blue"
      >
        <BoxTeamsList
          contestId={contestId}
          onDeliveryChanged={() => setHistoryKey((current) => current + 1)}
        />
      </BoxFeatures>

      <BoxFeatures
        title="Histórico de tarefas"
        icon={HistoryIcon}
        blobSize="sm"
        blobTone="down"
      >
        <TaskHistoryList contestId={contestId} refreshKey={historyKey} />
      </BoxFeatures>
    </>
  );
}
