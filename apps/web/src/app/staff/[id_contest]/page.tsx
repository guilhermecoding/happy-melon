import { Suspense } from 'react'
import Page from '@/components/ui/page'
import Section from '@/components/ui/section'
import Loading from '@/app/loading'
import { Metadata } from 'next'
import QueueTask from './_components/queue-task'
import LobbyArea from './_components/lobby-area'

export const metadata: Metadata = {
  title: 'Tarefas',
}

async function StaffContestPageContent({
  params,
}: Omit<PageProps<'/staff/[id_contest]'>, 'searchParams'>) {
  const { id_contest } = await params

  return (
    <Page className="flex min-h-0 flex-1 flex-col overflow-hidden pb-6">
      <Section className="shrink-0">
        <h1 className="text-xl sm:text-5xl font-black text-center">Maratona Mineira de Programação</h1>
      </Section>

      <Section className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden @4xl:flex-row">
        <QueueTask />
        <LobbyArea />
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
