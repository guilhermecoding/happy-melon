import { Suspense } from 'react';
import BoxFeatures from '@/components/box-features';
import BoxAccessControllCollab from './_components/box-access-controll-collab';
import TitlePage from '@/components/title-page';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import Loading from '@/app/loading';
import { contestService } from '@/services/contest/contest.service';
import { FilterVerticalIcon, ThumbsUpIcon, UserIcon } from '@hugeicons/core-free-icons';
import { Metadata } from 'next';
import BoxListCollaborators from './_components/box-list-collaborators';

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
            <Section className="mt-4 flex flex-col @5xl/main:flex-row gap-4">
                <div className="w-full @5xl/main:w-3/5">
                    <BoxFeatures title="Lista de colaboradores"
                        icon={UserIcon}
                        blobSize="sm"
                        blobTone="yellow"
                    >
                        <BoxListCollaborators contestId={contest.id} />
                    </BoxFeatures>
                </div>
                <div className="w-full @5xl/main:w-2/5">
                    <BoxFeatures title="Controle e acesso"
                        icon={FilterVerticalIcon}
                        blobSize="sm"
                        blobTone="mint"
                    >
                        <BoxAccessControllCollab contest={contest} />
                    </BoxFeatures>
                </div>
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
