import { Suspense } from 'react';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import TitlePage from '@/components/title-page';
import { UserMultiple02Icon } from '@hugeicons/core-free-icons';
import Loading from '@/app/loading';
import { Metadata } from 'next';
import { TeamsPanel } from './_components/teams-panel';

export const metadata: Metadata = {
  title: 'Times',
};

async function AdminTeamsPageContent({
  params,
}: Omit<PageProps<'/admin/competicoes/[id_contest]/times'>, 'searchParams'>) {
  const { id_contest } = await params;

  return (
    <Page>
      <Section>
        <TitlePage title="Times" icon={UserMultiple02Icon} />
      </Section>
      <Section className="mt-6">
        <TeamsPanel contestId={id_contest} />
      </Section>
    </Page>
  );
}

export default function AdminTeamsPage({
  params,
}: PageProps<'/admin/competicoes/[id_contest]/times'>) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminTeamsPageContent params={params} />
    </Suspense>
  );
}
