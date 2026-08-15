import { Suspense } from 'react';
import TitlePage from '@/components/title-page';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import Loading from '@/app/loading';
import { contestService } from '@/services/contest/contest.service';
import { ThumbsUpIcon } from '@hugeicons/core-free-icons';
import { Metadata } from 'next';
import { CollaboratorsGeralPanel } from './_components/collaborators-geral-panel';
import { CollaboratorsPageTabs } from './_components/collaborators-page-tabs';

export const metadata: Metadata = {
    title: 'Colaboradores',
};

async function AdminCompetitionColaboratorsPageContent({
    params,
}: Omit<
    PageProps<'/admin/competicoes/[id_contest]/colaboradores'>,
    'searchParams'
>) {
    const { id_contest } = await params;
    const contest = await contestService.get(id_contest);

    return (
        <Page>
            <Section>
                <TitlePage title="Colaboradores" icon={ThumbsUpIcon} />
            </Section>

            <Section className="mt-6">
                <CollaboratorsPageTabs
                    geral={<CollaboratorsGeralPanel contest={contest} />}
                    score={null}
                />
            </Section>
        </Page>
    );
}

export default function AdminCompetitionColaboratorsPage({
    params,
}: PageProps<'/admin/competicoes/[id_contest]/colaboradores'>) {
    return (
        <Suspense fallback={<Loading />}>
            <AdminCompetitionColaboratorsPageContent params={params} />
        </Suspense>
    );
}
