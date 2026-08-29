import { getApiBaseUrl } from '@/lib/api-url';

export type SessionPayload = {
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

export type SessionLookup =
  | { status: 'authenticated'; session: NonNullable<SessionPayload>; setCookies: string[] }
  | { status: 'unauthenticated'; session: null; setCookies: string[] }
  | { status: 'unknown'; session: null; setCookies: string[] };

const SESSION_COOKIE_RE =
  /(?:^|;\s*)(?:__Secure-)?better-auth\.session_token=/;

export function hasSessionCookie(cookieHeader: string): boolean {
  return SESSION_COOKIE_RE.test(cookieHeader);
}

function readSetCookies(response: Response): string[] {
  if (typeof response.headers.getSetCookie === 'function') {
    return response.headers.getSetCookie();
  }
  return [];
}

async function fetchGetSession(cookie: string): Promise<Response | null> {
  const url = `${getApiBaseUrl()}/api/auth/get-session`;
  const init: RequestInit = {
    method: 'GET',
    headers: { cookie },
    cache: 'no-store',
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, init);
      if (response.ok || attempt === 1) {
        return response;
      }
    } catch {
      if (attempt === 1) {
        return null;
      }
    }
  }

  return null;
}

export async function lookupSession(cookieHeader: string): Promise<SessionLookup> {
  if (!cookieHeader || !hasSessionCookie(cookieHeader)) {
    return { status: 'unauthenticated', session: null, setCookies: [] };
  }

  const response = await fetchGetSession(cookieHeader);
  if (!response) {
    return { status: 'unknown', session: null, setCookies: [] };
  }

  const setCookies = readSetCookies(response);

  if (!response.ok) {
    return { status: 'unknown', session: null, setCookies };
  }

  let data: SessionPayload = null;
  try {
    data = (await response.json()) as SessionPayload;
  } catch {
    data = null;
  }

  if (data?.session) {
    return { status: 'authenticated', session: data, setCookies };
  }

  return { status: 'unauthenticated', session: null, setCookies };
}
