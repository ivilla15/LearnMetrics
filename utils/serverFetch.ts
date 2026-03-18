export function getBaseUrlFromHeadersLike(h: { get(name: string): string | null }) {
  const host = h.get('host');
  const proto = h.get('x-forwarded-proto') ?? 'http';

  if (!host) throw new Error('Missing Host header');
  return `${proto}://${host}`;
}

export function getCookieHeaderFromHeadersLike(h: { get(name: string): string | null }) {
  return h.get('cookie') ?? '';
}
