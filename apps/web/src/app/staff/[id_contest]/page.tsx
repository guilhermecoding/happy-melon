import { Suspense } from 'react'
import Page from '@/components/ui/page'
import Section from '@/components/ui/section'
import Loading from '@/app/loading'
import { Metadata } from 'next'
import StaffTasksBoard from './_components/staff-tasks-board'

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
        <h1 className="text-xl sm:text-5xl font-black text-center">
          Maratona Mineira de Programação
        </h1>
      </Section>

      <Section className="mt-4 pb-40 lg:pb-8">
        <StaffTasksBoard contestId={id_contest} />
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
