import { headers } from 'next/headers';
import { getBaseUrlFromHeadersLike, getCookieHeaderFromHeadersLike } from './serverFetch';

export async function getBaseUrlFromHeaders() {
  const h = await headers();
  return getBaseUrlFromHeadersLike(h);
}

export async function getCookieHeader() {
  const h = await headers();
  return getCookieHeaderFromHeadersLike(h);
}
