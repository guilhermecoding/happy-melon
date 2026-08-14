import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import BoxOption from './_components/box-option';
import HomeGreeting from './_components/home-greeting';
import type { Metadata } from 'next';
import GreetingSkeleton from '@/components/skeletons/gretting-skeleton';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Início',
}

export default function AdminHomePage() {
    return (
        <Page>
            <Section>
                <Suspense fallback={<GreetingSkeleton />}>
                    <HomeGreeting />
                </Suspense>
            </Section>
            <Section className='flex flex-col md:flex-row gap-8 mt-6'>
                <BoxOption title='Administradores' type='users' tone='purple' />
                <BoxOption title='Competições' type='contests' tone='mint' />
            </Section>
        </Page>
    )
}
