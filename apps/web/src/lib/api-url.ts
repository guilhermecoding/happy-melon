/**
 * Browser: always NEXT_PUBLIC_API_URL (e.g. http://localhost:3000).
 * Server (RSC / proxy): prefer INTERNAL_API_URL inside Docker (http://api:3000),
 * otherwise the same public URL for local `pnpm dev`.
 */
export function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    return (
      process.env.INTERNAL_API_URL?.trim() ||
      process.env.NEXT_PUBLIC_API_URL?.trim() ||
      'http://localhost:3000'
    );
  }

  return process.env.NEXT_PUBLIC_API_URL?.trim() || 'http://localhost:3000';
}
