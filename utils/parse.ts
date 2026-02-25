import { AssignmentAttemptsFilter } from '@/types';

export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseCursor(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseIntSafe(raw: string): number | null {
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function parseAssignmentId(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === 'string') {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

export function parseAttemptsFilter(raw: string | null): AssignmentAttemptsFilter {
  const v = (raw ?? 'ALL').toUpperCase();

  if (v === 'MASTERY') return 'MASTERY';
  if (v === 'NOT_MASTERY') return 'NOT_MASTERY';
  if (v === 'MISSING') return 'MISSING';

  return 'ALL';
}

/**
 * Useful for client input fields where empty string means "unset".
 */
export function parseNumberOrUndefined(raw: string): number | undefined {
  const v = raw.trim();
  if (v.length === 0) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export type ParsedBulkStudent = {
  name: string;
  firstName: string;
  lastName: string;
  username: string;
};

export function parseBulkStudentsText(
  text: string,
  existingUsernames: ReadonlyArray<string> = [],
): ParsedBulkStudent[] {
  const taken = new Set(existingUsernames.map((u) => String(u).trim().toLowerCase()));
  const rows: ParsedBulkStudent[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const parts = line.split(/\s+/).filter(Boolean);
    if (parts.length < 2) continue;

    const first = parts[0];
    const last = parts[parts.length - 1];

    const displayName = parts.join(' ');

    const baseUsername = buildUsernameBase(first, last);
    if (!baseUsername) continue;

    const username = makeUniqueUsername(baseUsername, taken);
    taken.add(username.toLowerCase());

    rows.push({
      name: displayName,
      firstName: first,
      lastName: parts.slice(1).join(' '),
      username,
    });
  }

  return rows;
}

function buildUsernameBase(first: string, last: string): string | null {
  const f = normalizeUserFragment(first);
  const l = normalizeUserFragment(last);
  if (!f || !l) return null;
  return `${f[0]}${l}`;
}

function normalizeUserFragment(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function makeUniqueUsername(base: string, taken: Set<string>): string {
  let candidate = base;
  let i = 1;

  while (taken.has(candidate.toLowerCase())) {
    i += 1;
    candidate = `${base}${i}`;
  }

  return candidate;
}
