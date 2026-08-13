import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth/get-server-session'

export default async function StaffPage() {
  const session = await getServerSession()
  const contestId = session?.session?.activeContestId

  if (typeof contestId === 'string' && contestId.length > 0) {
    redirect(`/staff/${contestId}`)
  }

  redirect('/entrar')
}
