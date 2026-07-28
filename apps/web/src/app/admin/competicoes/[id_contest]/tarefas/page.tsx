import BoxFeatures from '@/components/box-features';
import BoxTeamsList from './_components/box-teams-list';
import TitlePage from '@/components/title-page';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import { BalloonIcon, ClipboardCheckIcon, HistoryIcon } from '@hugeicons/core-free-icons';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tarefas'
}

export default function AdminTasksPage() {
    return (
        <Page>
            <Section>
                <TitlePage title='Tarefas' icon={ClipboardCheckIcon} />
            </Section>

            <Section className='mt-6 flex flex-col @4xl:flex-row gap-4'>
                <BoxFeatures title='Conquistas e solicitações' icon={BalloonIcon}>
                    <BoxTeamsList />
                </BoxFeatures>
                <BoxFeatures title='Histórico' icon={HistoryIcon} className='w-full @4xl:w-1/2'>
                    Teste
                </BoxFeatures>
            </Section>
        </Page>
    )
}
