import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Loading from '@/app/loading'
import CountdownContest from '../_components/countdown-contest'
import { ContestServiceError } from '@/services/contest/contest.error'
import { contestService } from '@/services/contest/contest.service'

async function StaffContestLayoutContent({
  children,
  params,
}: LayoutProps<'/staff/[id_contest]'>) {
  const { id_contest } = await params

  let contest
  try {
    contest = await contestService.get(id_contest)
  } catch (error) {
    if (error instanceof ContestServiceError && error.status === 404) {
      notFound()
    }
    throw error
  }

  return (
    <CountdownContest name={contest.name} startsAt={contest.startsAt}>
      {children}
    </CountdownContest>
  )
}

export default function StaffContestLayout({
  children,
  params,
}: LayoutProps<'/staff/[id_contest]'>) {
  return (
    <Suspense fallback={<Loading />}>
      <StaffContestLayoutContent params={params}>
        {children}
      </StaffContestLayoutContent>
    </Suspense>
  )
}
