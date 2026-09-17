import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Loading from '@/app/loading';
import ScoreFreezeNotice from '@/components/contest/score-freeze-notice';
import { ContestServiceError } from '@/services/contest/contest.error';
import { contestService } from '@/services/contest/contest.service';

async function ContestLayoutContent({
  children,
  params,
}: LayoutProps<'/admin/competicoes/[id_contest]'>) {
  const { id_contest } = await params;

  let contest;
  try {
    contest = await contestService.get(id_contest);
  } catch (error) {
    if (error instanceof ContestServiceError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return (
    <>
      {children}
      <ScoreFreezeNotice contest={contest} />
    </>
  );
}

export default function ContestLayout({
  children,
  params,
}: LayoutProps<'/admin/competicoes/[id_contest]'>) {
  return (
    <Suspense fallback={<Loading />}>
      <ContestLayoutContent params={params}>{children}</ContestLayoutContent>
    </Suspense>
  );
}
