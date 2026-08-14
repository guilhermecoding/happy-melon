import { getInternalApiUrl } from '@/lib/api-url';

const HOP_BY_HOP = new Set([
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

const ALLOWED_PREFIXES = [
  'api',
  'contests',
  'administrators',
  'teams',
  'questions',
  'me',
];

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function isAllowedPath(segments: string[]): boolean {
  const root = segments[0];
  return Boolean(root && ALLOWED_PREFIXES.includes(root));
}

function outgoingHeaders(request: Request): Headers {
  const headers = new Headers();

  request.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) {
      return;
    }
    headers.append(key, value);
  });

  const forwardedHost =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  const forwardedProto =
    request.headers.get('x-forwarded-proto') ??
    new URL(request.url).protocol.replace(/:$/, '');

  if (forwardedHost) {
    headers.set('x-forwarded-host', forwardedHost);
  }
  headers.set('x-forwarded-proto', forwardedProto);

  return headers;
}

async function proxyToApi(request: Request, context: RouteContext) {
  const { path } = await context.params;

  if (!isAllowedPath(path)) {
    return new Response('Not found', { status: 404 });
  }

  const search = new URL(request.url).search;
  const target = `${getInternalApiUrl()}/${path.join('/')}${search}`;
  const method = request.method.toUpperCase();
  const hasBody = method !== 'GET' && method !== 'HEAD';

  const upstream = await fetch(target, {
    method,
    headers: outgoingHeaders(request),
    body: hasBody ? request.body : undefined,
    duplex: hasBody ? 'half' : undefined,
    redirect: 'manual',
    cache: 'no-store',
  } as RequestInit);

  const headers = new Headers();
  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (
      lower === 'set-cookie' ||
      lower === 'content-encoding' ||
      lower === 'content-length' ||
      lower === 'transfer-encoding'
    ) {
      return;
    }
    headers.append(key, value);
  });

  const contentType = upstream.headers.get('content-type') ?? '';
  if (contentType.includes('text/event-stream')) {
    headers.set('Cache-Control', 'no-cache, no-transform');
    headers.set('X-Accel-Buffering', 'no');
  }

  const response = new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });

  const setCookies =
    typeof upstream.headers.getSetCookie === 'function'
      ? upstream.headers.getSetCookie()
      : [];
  for (const cookie of setCookies) {
    response.headers.append('Set-Cookie', cookie);
  }

  return response;
}

export const GET = proxyToApi;
export const POST = proxyToApi;
export const PUT = proxyToApi;
export const PATCH = proxyToApi;
export const DELETE = proxyToApi;
export const HEAD = proxyToApi;
export const OPTIONS = proxyToApi;
