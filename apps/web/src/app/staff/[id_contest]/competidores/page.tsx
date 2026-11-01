import { Suspense } from 'react'
import type { Metadata } from 'next'
import { UserMultiple02Icon } from '@hugeicons/core-free-icons'
import Loading from '@/app/loading'
import TitlePage from '@/components/title-page'
import Page from '@/components/ui/page'
import Section from '@/components/ui/section'
import { StaffBackLink } from '../_components/staff-back-link'
import { StaffTeamsPanel } from './_components/staff-teams-panel'

export const metadata: Metadata = {
  title: 'Competidores',
}

async function StaffTeamsPageContent({
  params,
}: Omit<PageProps<'/staff/[id_contest]/competidores'>, 'searchParams'>) {
  const { id_contest } = await params

  return (
    <>
      <StaffBackLink href={`/staff/${id_contest}`} />
      <Page>
        <Section>
          <TitlePage title="Competidores" icon={UserMultiple02Icon} />
        </Section>
        <Section className="mt-6">
          <StaffTeamsPanel contestId={id_contest} />
        </Section>
      </Page>
    </>
  )
}

export default function StaffTeamsPage({
  params,
}: PageProps<'/staff/[id_contest]/competidores'>) {
  return (
    <Suspense fallback={<Loading />}>
      <StaffTeamsPageContent params={params} />
    </Suspense>
  )
}
