import { Suspense } from 'react'
import TitlePage from '@/components/title-page'
import Page from '@/components/ui/page'
import Section from '@/components/ui/section'
import Loading from '@/app/loading'
import { ClipboardCheckIcon } from '@hugeicons/core-free-icons'
import { Metadata } from 'next'
import TasksBoard from '@/components/contest-tasks/tasks-board'

export const metadata: Metadata = {
  title: 'Tarefas',
}

async function StaffContestPageContent({
  params,
}: Omit<PageProps<'/staff/[id_contest]'>, 'searchParams'>) {
  const { id_contest } = await params

  return (
    <Page>
      <Section>
        <TitlePage title="Tarefas" icon={ClipboardCheckIcon} />
      </Section>

      <Section className="mt-6 flex flex-col gap-4 @4xl:flex-row">
        <TasksBoard contestId={id_contest} />
      </Section>
    </Page>
  )
}

export default function StaffContestPage({
  params,
}: PageProps<'/staff/[id_contest]'>) {
  return (
    <Suspense fallback={<Loading />}>
      <StaffContestPageContent params={params} />
    </Suspense>
  )
}
