import Loading from '@/app/loading'
import { lookupServerSession } from '@/lib/auth/get-server-session'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'

async function ChefHomeRedirect() {
  const result = await lookupServerSession()

  if (result.status === 'unknown') {
    return null
  }

  const contestId = result.session?.session?.activeContestId

  if (typeof contestId === 'string' && contestId.length > 0) {
    redirect(`/chef/${contestId}`)
  }

  redirect('/entrar')
}

export default function ChefPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ChefHomeRedirect />
    </Suspense>
  )
}
