import { Suspense } from 'react';
import { UserMultiple02Icon } from '@hugeicons/core-free-icons';
import type { Metadata } from 'next';
import Loading from '@/app/loading';
import { TeamsPlacementPanel } from '@/components/teams/teams-placement-panel';
import TitlePage from '@/components/title-page';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';

export const metadata: Metadata = {
  title: 'Competidores',
};

async function ChefTeamsPageContent({
  params,
}: Omit<PageProps<'/chef/[id_contest]/competidores'>, 'searchParams'>) {
  const { id_contest } = await params;

  return (
    <Page>
      <Section>
        <TitlePage title="Competidores" icon={UserMultiple02Icon} />
      </Section>
      <Section className="mt-6">
        <TeamsPlacementPanel contestId={id_contest} />
      </Section>
    </Page>
  );
}

export default function ChefTeamsPage({
  params,
}: PageProps<'/chef/[id_contest]/competidores'>) {
  return (
    <Suspense fallback={<Loading />}>
      <ChefTeamsPageContent params={params} />
    </Suspense>
  );
}
