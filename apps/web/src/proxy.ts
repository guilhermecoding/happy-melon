import { NextRequest, NextResponse } from 'next/server';

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

function getRole(session: SessionResponse): string | null {
  const role = session?.user?.role;
  return typeof role === 'string' ? role : null;
}

function loginRedirect(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/entrar', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

function getPostLoginRedirect(session: SessionResponse, request: NextRequest) {
  const role = getRole(session);
  const activeContestId = session?.session?.activeContestId;

  if (role === 'staff' && activeContestId) {
    return new URL(`/staff/${activeContestId}`, request.url);
  }

  if (role === 'admin') {
    return new URL('/admin', request.url);
  }

  return new URL('/entrar', request.url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await getSession(request);
  const role = getRole(session);
  const activeContestId = session?.session?.activeContestId ?? null;

  if (pathname.startsWith('/admin')) {
    if (role === 'staff' && activeContestId) {
      return NextResponse.redirect(
        new URL(`/staff/${activeContestId}`, request.url),
      );
    }
    if (role !== 'admin') {
      return loginRedirect(request, pathname);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/staff')) {
    if (role === 'admin') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (role !== 'staff' || !activeContestId) {
      return loginRedirect(request, pathname);
    }

    const staffHome = `/staff/${activeContestId}`;
    const onOwnContest =
      pathname === staffHome || pathname.startsWith(`${staffHome}/`);
    if (!onOwnContest) {
      return NextResponse.redirect(new URL(staffHome, request.url));
    }

    return NextResponse.next();
  }

  if (pathname === '/entrar') {
    if (role === 'admin' || (role === 'staff' && activeContestId)) {
      return NextResponse.redirect(getPostLoginRedirect(session, request));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/staff/:path*', '/entrar'],
};
