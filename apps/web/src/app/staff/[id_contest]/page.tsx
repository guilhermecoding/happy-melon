import { Suspense } from 'react'
import {
  ClipboardCheckIcon,
  UserMultiple02Icon,
} from '@hugeicons/core-free-icons'
import type { Metadata } from 'next'
import HomeGreeting from '@/app/admin/home/_components/home-greeting'
import Loading from '@/app/loading'
import GreetingSkeleton from '@/components/skeletons/gretting-skeleton'
import Page from '@/components/ui/page'
import Section from '@/components/ui/section'
import { StaffOptionCard } from './_components/staff-option-card'

export const metadata: Metadata = {
  title: 'Início',
}

async function StaffOptionCards({
  params,
}: Omit<PageProps<'/staff/[id_contest]'>, 'searchParams'>) {
  const { id_contest } = await params

  return (
    <>
      <StaffOptionCard
        title="Tarefas"
        href={`/staff/${id_contest}/tarefas`}
        tone="mint"
        icon={ClipboardCheckIcon}
      />
      <StaffOptionCard
        title="Competidores"
        href={`/staff/${id_contest}/competidores`}
        tone="orange"
        icon={UserMultiple02Icon}
      />
    </>
  )
}

export default function StaffHomePage({
  params,
}: PageProps<'/staff/[id_contest]'>) {
  return (
    <Page>
      <Section>
        <Suspense fallback={<GreetingSkeleton />}>
          <HomeGreeting />
        </Suspense>
      </Section>
      <Section className="mt-6 flex flex-col gap-8 md:flex-row">
        <Suspense fallback={<Loading />}>
          <StaffOptionCards params={params} />
        </Suspense>
      </Section>
    </Page>
  )
}
