import { Suspense } from 'react';
import BoxFeatures from '@/components/box-features';
import BoxTeamsList from './_components/box-teams-list';
import TitlePage from '@/components/title-page';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import Loading from '@/app/loading';
import {
  BalloonIcon,
  ClipboardCheckIcon,
  HistoryIcon,
} from '@hugeicons/core-free-icons';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tarefas',
};

async function AdminTasksPageContent({
  params,
}: Omit<PageProps<'/admin/competicoes/[id_contest]/tarefas'>, 'searchParams'>) {
  const { id_contest } = await params;

  return (
    <Page>
      <Section>
        <TitlePage title="Tarefas" icon={ClipboardCheckIcon} />
      </Section>

      <Section className="mt-6 flex flex-col gap-4 @4xl:flex-row">
        <BoxFeatures title="Conquistas e solicitações" icon={BalloonIcon}>
          <BoxTeamsList contestId={id_contest} />
        </BoxFeatures>
        <BoxFeatures
          title="Histórico"
          icon={HistoryIcon}
          className="w-full @4xl:w-1/2"
        >
          Teste
        </BoxFeatures>
      </Section>
    </Page>
  );
}

export default function AdminTasksPage({
  params,
}: PageProps<'/admin/competicoes/[id_contest]/tarefas'>) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminTasksPageContent params={params} />
    </Suspense>
  );
}
