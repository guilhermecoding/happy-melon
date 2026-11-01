import { Suspense } from 'react'
import type { Metadata } from 'next'
import Loading from '@/app/loading'
import Page from '@/components/ui/page'
import Section from '@/components/ui/section'
import { contestService } from '@/services/contest/contest.service'
import CountdownContest from '../../_components/countdown-contest'
import { StaffBackLink } from '../_components/staff-back-link'
import StaffContestHeading from '../_components/staff-contest-heading'
import StaffRoundContent from '../_components/staff-round-content'
import StaffTasksBoard from '../_components/staff-tasks-board'

export const metadata: Metadata = {
  title: 'Tarefas',
}

async function StaffTasksPageContent({
  params,
}: Omit<PageProps<'/staff/[id_contest]/tarefas'>, 'searchParams'>) {
  const { id_contest } = await params
  const contest = await contestService.get(id_contest)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <StaffBackLink href={`/staff/${id_contest}`} />
      <CountdownContest contest={contest}>
        <StaffRoundContent>
          <Page>
            <Section>
              <StaffContestHeading name={contest.name} />
            </Section>

            <Section className="mt-4 pb-40 lg:pb-8">
              <StaffTasksBoard contestId={id_contest} />
            </Section>
          </Page>
        </StaffRoundContent>
      </CountdownContest>
    </div>
  )
}

export default function StaffTasksPage({
  params,
}: PageProps<'/staff/[id_contest]/tarefas'>) {
  return (
    <Suspense fallback={<Loading />}>
      <StaffTasksPageContent params={params} />
    </Suspense>
  )
}
