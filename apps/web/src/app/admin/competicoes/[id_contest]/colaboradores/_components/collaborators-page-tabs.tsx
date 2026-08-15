'use client';

import { useState, type ReactNode } from 'react';
import { Tabs } from '@/components/pouf/disclosure';

export function CollaboratorsPageTabs({
  geral,
  score,
}: {
  geral: ReactNode;
  score: ReactNode;
}) {
  const [tab, setTab] = useState('geral');

  return (
    <Tabs
      value={tab}
      onChange={setTab}
      tabs={[
        { value: 'geral', label: 'Geral', content: geral },
        { value: 'score', label: 'Score', content: score },
      ]}
    />
  );
}
