'use client';

import { useLayoutEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Tabs } from '@/components/pouf/disclosure';

const DEFAULT_TAB = 'geral';

export function CollaboratorsPageTabs({
  geral,
  score,
}: {
  geral: ReactNode;
  score: ReactNode;
}) {
  const pathname = usePathname();
  const [tab, setTab] = useState(DEFAULT_TAB);

  useLayoutEffect(() => {
    setTab(DEFAULT_TAB);
  }, [pathname]);

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
