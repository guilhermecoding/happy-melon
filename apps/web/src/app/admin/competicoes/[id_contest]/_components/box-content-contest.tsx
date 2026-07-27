import { Suspense } from 'react';
import React from 'react';
import { contestService } from '@/services/contest/contest.service';
import { getContestErrorMessage } from '@/services/contest/contest.error';
import { Skeleton } from '@/components/ui/skeleton';
import BoxContentContestView from './box-content-contest-view';

function BoxContentContesSkeleton() {
  return (
    <div className="p-4 flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <React.Fragment key={index}>
          <Skeleton className="w-20 h-3 bg-muted-foreground/20" />
          <Skeleton className="w-50 h-5 bg-muted-foreground/20" />
        </React.Fragment>
      ))}
    </div>
  );
}

async function BoxContentContestFetch({
  idContest,
}: {
  idContest: string;
}) {
  try {
    const contest = await contestService.get(idContest);
    return <BoxContentContestView contest={contest} />;
  } catch (error) {
    return (
      <div className="p-4">
        <p role="alert" className="text-sm text-destructive">
          {getContestErrorMessage(
            error,
            'Não foi possível carregar a competição.',
          )}
        </p>
      </div>
    );
  }
}

export default function BoxContentContest({
  idContest,
}: {
  idContest: string;
}) {
  return (
    <Suspense fallback={<BoxContentContesSkeleton />}>
      <BoxContentContestFetch idContest={idContest} />
    </Suspense>
  );
}
