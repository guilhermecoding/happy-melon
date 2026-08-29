import { redirect } from 'next/navigation'
import { lookupServerSession } from '@/lib/auth/get-server-session'

export default async function StaffPage() {
  const result = await lookupServerSession()

  if (result.status === 'unknown') {
    return null
  }

  const contestId = result.session?.session?.activeContestId

  if (typeof contestId === 'string' && contestId.length > 0) {
    redirect(`/staff/${contestId}`)
  }

  redirect('/entrar')
}
