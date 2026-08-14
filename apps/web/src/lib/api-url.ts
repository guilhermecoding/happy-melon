/**
 * Browser: same origin (empty base). The Next server proxies /api, /contests,
 * etc. to the Nest API so the session cookie stays first-party.
 *
 * Server (RSC / proxy.ts / route handler): INTERNAL_API_URL, e.g. http://api:3000
 * in Compose or http://localhost:3000 for `pnpm dev`.
 */
export function getInternalApiUrl(): string {
  return (
    process.env.INTERNAL_API_URL?.trim() || 'http://localhost:3000'
  ).replace(/\/$/, '');
}

export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return getInternalApiUrl();
  }

  return '';
}
