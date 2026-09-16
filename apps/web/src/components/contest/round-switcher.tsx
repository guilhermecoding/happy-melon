'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select } from '@/components/pouf/controls';
import type { Contest } from '@/services/contest/contest.type';

type RoundSwitcherProps = {
  contest: Contest;
  selectedRoundId: string;
  alwaysShow?: boolean;
};

export default function RoundSwitcher({
  contest,
  selectedRoundId,
  alwaysShow = false,
}: RoundSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (contest.rounds.length === 0) {
    return null;
  }

  if (!alwaysShow && contest.rounds.length <= 1) {
    return null;
  }

  const options = contest.rounds.map((round) => ({
    value: round.id,
    label: round.name,
  }));

  return (
    <div className="mb-4 max-w-sm">
      <Select
        value={selectedRoundId}
        options={options}
        onChange={(value) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set('round', value);
          router.replace(`${pathname}?${params.toString()}`);
        }}
      />
    </div>
  );
}
