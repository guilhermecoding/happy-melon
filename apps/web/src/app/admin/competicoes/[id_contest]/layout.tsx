import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Loading from '@/app/loading';
import { ContestServiceError } from '@/services/contest/contest.error';
import { contestService } from '@/services/contest/contest.service';

async function ContestLayoutContent({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id_contest: string }>;
}) {
  const { id_contest } = await params;

  try {
    await contestService.get(id_contest);
  } catch (error) {
    if (error instanceof ContestServiceError && error.status === 404) {
      notFound();
    }

    throw error;
  }

  return children;
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
