'use client';

import { useState, type ReactNode } from 'react';
import { Tabs } from '@/components/pouf/disclosure';

const DEFAULT_TAB = 'geral';

export function CollaboratorsPageTabs({
  geral,
  score,
}: {
  geral: ReactNode;
  score: ReactNode;
}) {
  const [tab, setTab] = useState(DEFAULT_TAB);

  return (
    <Tabs
      value={tab}
      onChange={setTab}
      tone="purple"
      tabs={[
        { value: 'geral', label: 'Geral', content: geral },
        { value: 'score', label: 'Score', content: score },
      ]}
    />
  );
}
