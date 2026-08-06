import { redirect } from 'next/navigation'
import {
  getServerSession,
  isValidStaffSession,
} from '@/lib/auth/get-server-session'

export default async function StaffPage() {
  const session = await getServerSession()
  const contestId = session?.session?.activeContestId

  if (isValidStaffSession(session) && contestId) {
    redirect(`/staff/${contestId}`)
  }

  redirect('/entrar')
}
