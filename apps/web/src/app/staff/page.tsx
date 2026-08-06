import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

type SessionResponse = {
  user?: { role?: string | null }
  session?: { activeContestId?: string | null } | null
} | null

async function getSession(): Promise<SessionResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'
  const cookieStore = await cookies()
  const cookie = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ')

  if (!cookie) return null

  try {
    const response = await fetch(`${apiUrl}/api/auth/get-session`, {
      method: 'GET',
      headers: { cookie },
      cache: 'no-store',
    })
    if (!response.ok) return null
    const data = (await response.json()) as SessionResponse
    return data?.session ? data : null
  } catch {
    return null
  }
}

export default async function StaffPage() {
  const session = await getSession()
  const contestId = session?.session?.activeContestId

  if (session?.user?.role === 'staff' && contestId) {
    redirect(`/staff/${contestId}`)
  }

  redirect('/entrar')
}
