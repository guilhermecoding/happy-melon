import React from 'react';
import Page from '@/components/ui/page';
import Section from '@/components/ui/section';
import BoxOption from './_components/box-option';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Início',
}

export default function AdminHomePage() {
    return (
        <Page>
            <Section>
                <h1 className="text-3xl font-bold">Boa noite, Matheus!</h1>
            </Section>
            <Section className='flex flex-row gap-8 mt-6'>
                <BoxOption title='Competições' type='contests' />
                <BoxOption title='Usuários' type='users' />
            </Section>
        </Page>
    )
}
