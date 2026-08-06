import { cookies } from 'next/headers';

export type ServerSession = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string | null;
    role?: string | null;
  };
  session?: {
    activeContestId?: string | null;
  } | null;
} | null;

export async function getServerSession(): Promise<ServerSession> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  if (!cookie) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/api/auth/get-session`, {
      method: 'GET',
      headers: { cookie },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as ServerSession;
    return data?.session ? data : null;
  } catch {
    return null;
  }
}

export function isValidStaffSession(session: ServerSession): boolean {
  return (
    session?.user?.role === 'staff' &&
    typeof session.session?.activeContestId === 'string' &&
    session.session.activeContestId.length > 0
  );
}
