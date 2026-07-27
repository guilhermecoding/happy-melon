import BoxFeatures from './_components/box-features';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import { BadgeInfoIcon } from '@hugeicons/core-free-icons';
import BoxContentContest from './_components/box-content-contest';
import TitleContestPageManager from './_components/title-contest-page-manager';
import { Suspense } from 'react';
import Spinner from '@/components/spinner';

async function AdminContestManagementPageContent({
    params
}: Omit<PageProps<"/admin/competicoes/[id_contest]">, 'searchParams'>) {
    const { id_contest } = await params;

    return (
        <Page>
            <Section>
                <TitleContestPageManager idContest={id_contest} />
            </Section>
            <Section className='mt-6 flex flex-row gap-4'>
                <BoxFeatures title="Detalhes da competição" icon={BadgeInfoIcon}>
                    <BoxContentContest idContest={id_contest} />
                </BoxFeatures>
            </Section>
        </Page>
    );
}

export default function AdminContestManagementPage({
    params,
}: PageProps<"/admin/competicoes/[id_contest]">) {
    return (
        <Suspense fallback={<Spinner />}>
            <AdminContestManagementPageContent params={params} />
        </Suspense>
    );
}
