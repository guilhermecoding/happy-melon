import { Suspense } from 'react';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import TitlePage from '@/components/title-page';
import { File02Icon } from '@hugeicons/core-free-icons';
import BoxQuestions from './_components/box-questions';
import Loading from '@/app/loading';
import { Metadata } from 'next';
import { contestService } from '@/services/contest/contest.service';
import { pickRoundId } from '@/services/contest/contest.type';
import RoundSwitcher from '../_components/round-switcher';

export const metadata: Metadata = {
  title: 'Prova',
};

async function AdminExamPageContent({
  params,
  searchParams,
}: PageProps<'/admin/competicoes/[id_contest]/prova'>) {
  const { id_contest } = await params;
  const query = await searchParams;
  const contest = await contestService.get(id_contest);
  const roundParam = typeof query.round === 'string' ? query.round : null;
  const roundId = pickRoundId(contest, roundParam);

  return (
    <Page>
      <Section>
        <TitlePage title="Prova" icon={File02Icon} />
      </Section>
      <Section className="mt-6">
        <RoundSwitcher contest={contest} selectedRoundId={roundId ?? ''} />
        {roundId ? (
          <BoxQuestions contestId={roundId} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Cadastre uma rodada para montar a prova.
          </p>
        )}
      </Section>
    </Page>
  );
}

export default function AdminExamPage(
  props: PageProps<'/admin/competicoes/[id_contest]/prova'>,
) {
  return (
    <Suspense fallback={<Loading />}>
      <AdminExamPageContent {...props} />
    </Suspense>
  );
}
