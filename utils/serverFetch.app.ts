import { headers } from 'next/headers';
import { getBaseUrlFromHeadersLike, getCookieHeaderFromHeadersLike } from './serverFetch';

export function getBaseUrlFromHeaders() {
  const h = headers() as unknown as { get(name: string): string | null };
  return getBaseUrlFromHeadersLike(h);
}

export function getCookieHeader() {
  const h = headers() as unknown as { get(name: string): string | null };
  return getCookieHeaderFromHeadersLike(h);
}
