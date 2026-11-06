import { Suspense } from 'react';
import TitlePage from '@/components/title-page';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import Loading from '@/app/loading';
import { HistoryIcon } from '@hugeicons/core-free-icons';
import { Metadata } from 'next';
import TaskHistoryDetail from '@/components/tasks/task-history-detail';
import { contestService } from '@/services/contest/contest.service';
import { pickRoundId } from '@/services/contest/contest.type';
import RoundSwitcher from '@/components/contest/round-switcher';

export const metadata: Metadata = {
  title: 'Histórico de tarefas detalhado',
};

async function ChefTaskHistoryPageContent({
  params,
  searchParams,
}: PageProps<'/chef/[id_contest]/tarefas/historico'>) {
  const { id_contest } = await params;
  const query = await searchParams;
  const contest = await contestService.get(id_contest);
  const roundParam = typeof query.round === 'string' ? query.round : null;
  const roundId = pickRoundId(contest, roundParam);

  return (
    <Page>
      <Section>
        <TitlePage title="Histórico detalhado" icon={HistoryIcon} />
      </Section>

      <Section className="mt-6 flex flex-col gap-4">
        <RoundSwitcher
          alwaysShow
          contest={contest}
          selectedRoundId={roundId ?? ''}
        />
        {roundId ? (
          <TaskHistoryDetail roundId={roundId} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Cadastre uma rodada para gerenciar as tarefas.
          </p>
        )}
      </Section>
    </Page>
  );
}

export default function ChefTaskHistoryPage(
  props: PageProps<'/chef/[id_contest]/tarefas/historico'>,
) {
  return (
    <Suspense fallback={<Loading />}>
      <ChefTaskHistoryPageContent {...props} />
    </Suspense>
  );
}
