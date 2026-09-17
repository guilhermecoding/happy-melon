import { cookies } from 'next/headers';
import {
  lookupSession,
  type SessionPayload,
} from '@/lib/auth/lookup-session';

export type ServerSession = SessionPayload;

export type ServerSessionLookup = {
  status: 'authenticated' | 'unauthenticated' | 'unknown';
  session: ServerSession;
};

export async function lookupServerSession(): Promise<ServerSessionLookup> {
  const cookieStore = await cookies();
  const cookie = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join('; ');

  const result = await lookupSession(cookie);
  return {
    status: result.status,
    session: result.session,
  };
}

export async function getServerSession(): Promise<ServerSession> {
  const result = await lookupServerSession();
  return result.session;
}

export function isValidStaffSession(session: ServerSession): boolean {
  return (
    session?.user?.role === 'staff' &&
    typeof session.session?.activeContestId === 'string' &&
    session.session.activeContestId.length > 0
  );
}

export function isValidChefSession(session: ServerSession): boolean {
  return (
    session?.user?.role === 'chef' &&
    typeof session.session?.activeContestId === 'string' &&
    session.session.activeContestId.length > 0
  );
}
