import { headers } from 'next/headers';

export async function getBaseUrlFromHeaders() {
  const h = await headers();
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';

  if (!host) throw new Error('Missing Host header');
  return `${proto}://${host}`;
}

export async function getCookieHeader() {
  const h = await headers();
  return h.get('cookie') ?? '';
}
