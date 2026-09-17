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

async function AdminTasksPageContent({
  params,
  searchParams,
}: PageProps<'/admin/competicoes/[id_contest]/tarefas'>) {
  const { id_contest } = await params;
  const query = await searchParams;
  const contest = await contestService.get(id_contest);
  const roundParam = typeof query.round === 'string' ? query.round : null;
  const roundId = pickRoundId(contest, roundParam);
  const selectedRound = contest.rounds.find((round) => round.id === roundId);

  return (
    <Page>
      <Section>
        <TitlePage title="Tarefas" icon={ClipboardCheckIcon} />
      </Section>

      <Section className="mt-6 flex flex-col gap-4">
        <RoundSwitcher
          alwaysShow
          contest={contest}
          selectedRoundId={roundId ?? ''}
        />
        {roundId && selectedRound ? (
          <TasksBoard
            competitionId={id_contest}
            roundId={roundId}
            startsAt={selectedRound.startsAt}
            endsAt={selectedRound.endsAt}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Cadastre uma rodada para gerenciar as tarefas.
          </p>
        )}
      </Section>
    </Page>
  );
}

export default function AdminTasksPage(
  props: PageProps<'/admin/competicoes/[id_contest]/tarefas'>,
) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminTasksPageContent {...props} />
    </Suspense>
  );
}
