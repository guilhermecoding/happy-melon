import { NextRequest, NextResponse } from 'next/server';

const ADMIN_ROLES = new Set(['admin', 'staff']);

type SessionResponse = {
  user?: {
    role?: string | null;
  };
  session?: {
    activeContestId?: string | null;
  } | null;
} | null;

async function getSession(request: NextRequest): Promise<SessionResponse> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';
  const cookie = request.headers.get('cookie') ?? '';

  if (!cookie) {
    return null;
  }

  try {
    const response = await fetch(`${apiUrl}/api/auth/get-session`, {
      method: 'GET',
      headers: {
        cookie,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as SessionResponse;
    return data?.session ? data : null;
  } catch {
    return null;
  }
}

function hasAdminAccess(session: SessionResponse): boolean {
  const role = session?.user?.role;
  return typeof role === 'string' && ADMIN_ROLES.has(role);
}

function getPostLoginRedirect(session: SessionResponse, request: NextRequest) {
  const activeContestId = session?.session?.activeContestId;
  if (activeContestId) {
    return new URL(
      `/admin/competicoes/${activeContestId}/tarefas`,
      request.url,
    );
  }

  return new URL('/admin', request.url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);
  const isAuthenticatedAdmin = hasAdminAccess(session);

  if (pathname.startsWith('/admin') && !isAuthenticatedAdmin) {
    const loginUrl = new URL('/entrar', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/entrar' && isAuthenticatedAdmin) {
    return NextResponse.redirect(getPostLoginRedirect(session, request));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/entrar'],
};
