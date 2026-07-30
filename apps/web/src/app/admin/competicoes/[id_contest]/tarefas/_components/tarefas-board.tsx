"use client";

import { useState } from 'react';
import { BalloonIcon, HistoryIcon } from '@hugeicons/core-free-icons';
import BoxFeatures from '@/components/box-features';
import BoxTeamsList from './box-teams-list';
import TaskHistoryList from './task-history-list';

type TarefasBoardProps = {
  contestId: string;
};

export default function TarefasBoard({ contestId }: TarefasBoardProps) {
  const [historyKey, setHistoryKey] = useState(0);

  return (
    <>
      <BoxFeatures title="Times disponíveis" icon={BalloonIcon}>
        <BoxTeamsList
          contestId={contestId}
          onDeliveryChanged={() => setHistoryKey((current) => current + 1)}
        />
      </BoxFeatures>
      <BoxFeatures
        title="Histórico"
        icon={HistoryIcon}
        className="w-full @4xl:w-1/2"
      >
        <TaskHistoryList contestId={contestId} refreshKey={historyKey} />
      </BoxFeatures>
    </>
  );
}
