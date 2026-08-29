import { NextRequest, NextResponse } from 'next/server';
import {
  lookupSession,
  type SessionLookup,
  type SessionPayload,
} from '@/lib/auth/lookup-session';

function applySetCookies(response: NextResponse, setCookies: string[]) {
  for (const cookie of setCookies) {
    response.headers.append('Set-Cookie', cookie);
  }
  return response;
}

function getRole(session: SessionPayload): string | null {
  const role = session?.user?.role;
  return typeof role === 'string' ? role : null;
}

function loginRedirect(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/entrar', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

function getPostLoginRedirect(session: SessionPayload, request: NextRequest) {
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
  const lookup: SessionLookup = await lookupSession(
    request.headers.get('cookie') ?? '',
  );
  const session = lookup.session;
  const role = getRole(session);
  const activeContestId = session?.session?.activeContestId ?? null;
  const sessionUncertain = lookup.status === 'unknown';

  const respond = (response: NextResponse) =>
    applySetCookies(response, lookup.setCookies);

  if (pathname === '/') {
    if (role === 'admin') {
      return respond(NextResponse.redirect(new URL('/admin', request.url)));
    }
    if (role === 'staff') {
      return respond(NextResponse.redirect(new URL('/staff', request.url)));
    }
    if (sessionUncertain) {
      return respond(NextResponse.next());
    }
    return respond(NextResponse.redirect(new URL('/entrar', request.url)));
  }

  if (pathname.startsWith('/admin')) {
    if (role === 'staff' && activeContestId) {
      return respond(
        NextResponse.redirect(new URL(`/staff/${activeContestId}`, request.url)),
      );
    }
    if (sessionUncertain) {
      return respond(NextResponse.next());
    }
    if (role !== 'admin') {
      return respond(loginRedirect(request, pathname));
    }
    return respond(NextResponse.next());
  }

  if (pathname.startsWith('/staff')) {
    if (role === 'admin') {
      return respond(NextResponse.redirect(new URL('/admin', request.url)));
    }
    if (sessionUncertain) {
      return respond(NextResponse.next());
    }
    if (role !== 'staff' || !activeContestId) {
      return respond(loginRedirect(request, pathname));
    }

    // Allow shared staff pages without forcing the contest route.
    if (
      pathname === '/staff' ||
      pathname === '/staff/' ||
      pathname === '/staff/sobre'
    ) {
      return respond(NextResponse.next());
    }

    const staffHome = `/staff/${activeContestId}`;
    const onOwnContest =
      pathname === staffHome || pathname.startsWith(`${staffHome}/`);
    if (!onOwnContest) {
      return respond(NextResponse.redirect(new URL(staffHome, request.url)));
    }

    return respond(NextResponse.next());
  }

  if (pathname === '/entrar') {
    if (role === 'admin' || (role === 'staff' && activeContestId)) {
      return respond(
        NextResponse.redirect(getPostLoginRedirect(session, request)),
      );
    }
  }

  return respond(NextResponse.next());
}

export const config = {
  matcher: ['/', '/admin/:path*', '/staff/:path*', '/entrar'],
};
