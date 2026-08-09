import BoxFeatures from '@/components/box-features';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import { BadgeInfoIcon } from '@hugeicons/core-free-icons';
import BoxContentContest from './_components/box-content-contest';
import TitleContestPageManager from './_components/title-contest-page-manager';
import { Suspense } from 'react';
import { CustomizeIcon } from '@hugeicons/core-free-icons';
import BoxContentOptions from './_components/box-content-options';
import Loading from '@/app/loading';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Gerenciar Competição'
}

async function AdminContestManagementPageContent({
    params
}: Omit<PageProps<"/admin/competicoes/[id_contest]">, 'searchParams'>) {
    const { id_contest } = await params;

    return (
        <Page>
            <Section>
                <TitleContestPageManager idContest={id_contest} />
            </Section>
            <Section className='mt-6 flex flex-col @2xl:flex-row gap-4'>
                <div className="w-full sm:w-3/5">
                    <BoxFeatures title="Detalhes da competição" icon={BadgeInfoIcon}
                        blobSize="sm"
                        blobTone="blue"
                    >
                        <BoxContentContest idContest={id_contest} />
                    </BoxFeatures>
                </div>
                <div className="w-full sm:w-2/5">
                    <BoxFeatures title="Opções" icon={CustomizeIcon}
                        blobSize="sm"
                        blobTone="yellow"
                    >
                        <BoxContentOptions idContest={id_contest} />
                    </BoxFeatures>
                </div>
            </Section>
        </Page>
    );
}

export default function AdminContestManagementPage({
    params,
}: PageProps<"/admin/competicoes/[id_contest]">) {
    return (
        <Suspense fallback={<Loading />}>
            <AdminContestManagementPageContent params={params} />
        </Suspense>
    );
}
