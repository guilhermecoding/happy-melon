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

function chefHome(activeContestId: string | null, request: NextRequest) {
  if (activeContestId) {
    return new URL(`/chef/${activeContestId}`, request.url);
  }
  return new URL('/chef', request.url);
}

function staffHome(activeContestId: string | null, request: NextRequest) {
  if (activeContestId) {
    return new URL(`/staff/${activeContestId}`, request.url);
  }
  return new URL('/staff', request.url);
}

function getPostLoginRedirect(session: SessionPayload, request: NextRequest) {
  const role = getRole(session);
  const activeContestId = session?.session?.activeContestId ?? null;

  if (role === 'staff' && activeContestId) {
    return staffHome(activeContestId, request);
  }

  if (role === 'chef') {
    return chefHome(activeContestId, request);
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
    if (role === 'chef') {
      return respond(NextResponse.redirect(chefHome(activeContestId, request)));
    }
    if (role === 'staff') {
      return respond(NextResponse.redirect(staffHome(activeContestId, request)));
    }
    if (sessionUncertain) {
      return respond(NextResponse.next());
    }
    return respond(NextResponse.redirect(new URL('/entrar', request.url)));
  }

  if (pathname.startsWith('/admin')) {
    if (role === 'staff' && activeContestId) {
      return respond(NextResponse.redirect(staffHome(activeContestId, request)));
    }
    if (role === 'chef') {
      return respond(NextResponse.redirect(chefHome(activeContestId, request)));
    }
    if (sessionUncertain) {
      return respond(NextResponse.next());
    }
    if (role !== 'admin') {
      return respond(loginRedirect(request, pathname));
    }
    return respond(NextResponse.next());
  }

  if (pathname.startsWith('/chef')) {
    if (role === 'admin') {
      return respond(NextResponse.redirect(new URL('/admin', request.url)));
    }
    if (role === 'staff' && activeContestId) {
      return respond(NextResponse.redirect(staffHome(activeContestId, request)));
    }
    if (sessionUncertain) {
      return respond(NextResponse.next());
    }
    if (role !== 'chef') {
      return respond(loginRedirect(request, pathname));
    }

    if (
      pathname === '/chef' ||
      pathname === '/chef/' ||
      pathname === '/chef/sobre'
    ) {
      return respond(NextResponse.next());
    }

    if (!activeContestId) {
      return respond(loginRedirect(request, pathname));
    }

    const ownHome = `/chef/${activeContestId}`;
    const onOwnContest =
      pathname === ownHome || pathname.startsWith(`${ownHome}/`);
    if (!onOwnContest) {
      return respond(NextResponse.redirect(new URL(ownHome, request.url)));
    }

    return respond(NextResponse.next());
  }

  if (pathname.startsWith('/staff')) {
    if (role === 'admin') {
      return respond(NextResponse.redirect(new URL('/admin', request.url)));
    }
    if (role === 'chef') {
      return respond(NextResponse.redirect(chefHome(activeContestId, request)));
    }
    if (sessionUncertain) {
      return respond(NextResponse.next());
    }
    if (role !== 'staff' || !activeContestId) {
      return respond(loginRedirect(request, pathname));
    }

    if (
      pathname === '/staff' ||
      pathname === '/staff/' ||
      pathname === '/staff/sobre'
    ) {
      return respond(NextResponse.next());
    }

    const ownHome = `/staff/${activeContestId}`;
    const onOwnContest =
      pathname === ownHome || pathname.startsWith(`${ownHome}/`);
    if (!onOwnContest) {
      return respond(NextResponse.redirect(new URL(ownHome, request.url)));
    }

    return respond(NextResponse.next());
  }

  if (pathname === '/entrar') {
    if (
      role === 'admin' ||
      role === 'chef' ||
      (role === 'staff' && activeContestId)
    ) {
      return respond(
        NextResponse.redirect(getPostLoginRedirect(session, request)),
      );
    }
  }

  return respond(NextResponse.next());
}

export const config = {
  matcher: ['/', '/admin/:path*', '/chef/:path*', '/staff/:path*', '/entrar'],
};
