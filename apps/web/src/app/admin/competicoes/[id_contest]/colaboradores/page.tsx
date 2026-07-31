import { Suspense } from 'react';
import BoxFeatures from '@/components/box-features';
import BoxAccessControllCollab from './_components/box-access-controll-collab';
import TitlePage from '@/components/title-page';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import Loading from '@/app/loading';
import { FilterVerticalIcon, ThumbsUpIcon } from '@hugeicons/core-free-icons';
import { Metadata } from 'next';

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

    return (
        <Page>
            <Section>
                <TitlePage title="Colaboradores" icon={ThumbsUpIcon} />
            </Section>
            <Section className="mt-4">
                <BoxFeatures title="Controle e acesso" icon={FilterVerticalIcon} className='w-2/5'>
                    <BoxAccessControllCollab contestId={id_contest} />
                </BoxFeatures>
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
