'use client';

import { useContestSchedule } from '@/app/staff/_components/countdown-contest';

type StaffContestHeadingProps = {
  name: string;
};

export default function StaffContestHeading({ name }: StaffContestHeadingProps) {
  const { currentRoundName } = useContestSchedule();

  return (
    <>
      <h1 className="text-xl font-black text-center sm:text-5xl">{name}</h1>
      {currentRoundName ? (
        <p className="mt-2 text-center text-sm font-medium text-muted-foreground sm:text-lg">
          {currentRoundName}
        </p>
      ) : null}
    </>
  );
}
