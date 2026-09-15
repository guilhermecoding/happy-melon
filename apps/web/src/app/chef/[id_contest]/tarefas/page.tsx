import { Suspense } from 'react';
import TitlePage from '@/components/title-page';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import Loading from '@/app/loading';
import { ClipboardCheckIcon } from '@hugeicons/core-free-icons';
import { Metadata } from 'next';
import TasksBoard from '@/components/tasks/tasks-board';
import { contestService } from '@/services/contest/contest.service';
import { pickRoundId } from '@/services/contest/contest.type';
import RoundSwitcher from '@/components/contest/round-switcher';

export const metadata: Metadata = {
  title: 'Tarefas',
};

async function ChefTasksPageContent({
  params,
  searchParams,
}: PageProps<'/chef/[id_contest]/tarefas'>) {
  const { id_contest } = await params;
  const query = await searchParams;
  const contest = await contestService.get(id_contest);
  const roundParam = typeof query.round === 'string' ? query.round : null;
  const roundId = pickRoundId(contest, roundParam);

  return (
    <Page>
      <Section>
        <TitlePage title="Tarefas" icon={ClipboardCheckIcon} />
      </Section>

      <Section className="mt-6 flex flex-col gap-4">
        <RoundSwitcher contest={contest} selectedRoundId={roundId ?? ''} />
        {roundId ? (
          <div className="flex flex-col gap-4 @5xl:flex-row">
            <TasksBoard competitionId={id_contest} roundId={roundId} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Cadastre uma rodada para gerenciar as tarefas.
          </p>
        )}
      </Section>
    </Page>
  );
}

export default function ChefTasksPage(
  props: PageProps<'/chef/[id_contest]/tarefas'>,
) {
  return (
    <Suspense fallback={<Loading />}>
      <ChefTasksPageContent {...props} />
    </Suspense>
  );
}
