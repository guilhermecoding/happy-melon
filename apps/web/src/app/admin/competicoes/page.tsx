import React from 'react'
import Page from '@/components/ui/page'
import Section from '@/components/ui/section'
import TitlePage from '@/components/title-page'
import { BalloonIcon } from '@hugeicons/core-free-icons'

export default function AdminContestsPage() {
    return (
        <Page>
            <Section>
                <TitlePage title="Competições" icon={BalloonIcon} />
            </Section>
        </Page>
    )
}
