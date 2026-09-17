'use client';

import type { ReactNode } from 'react';
import { useContestSchedule } from '@/app/staff/_components/countdown-contest';

export default function StaffRoundContent({ children }: { children: ReactNode }) {
  const { currentRoundId } = useContestSchedule();

  if (!currentRoundId) {
    return null;
  }

  return children;
}
