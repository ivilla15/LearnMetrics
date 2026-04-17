import { AssignmentAttemptsFilter } from '@/types';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';

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
  startingDomain?: DomainCode;
  startingLevel?: number;
};

const DOMAIN_CODE_SET = new Set<string>(DOMAIN_CODES);
// Shorthand ADD/SUB/MUL/DIV → whole-number domain
const SHORTHAND_MAP: Record<string, DomainCode> = {
  ADD: 'ADD_WHOLE',
  SUB: 'SUB_WHOLE',
  MUL: 'MUL_WHOLE',
  DIV: 'DIV_WHOLE',
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
    const tokens = line
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tokens.length === 0) continue;

    const namePart = tokens[0];
    const nameTokens = namePart
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    if (nameTokens.length < 2) continue;

    const firstName = nameTokens[0];
    const lastName = nameTokens.slice(1).join(' ');
    const displayName = `${firstName} ${lastName}`.trim();

    let startingDomain: DomainCode | undefined = undefined;
    let startingLevel: number | undefined = undefined;

    for (let i = 1; i < tokens.length; i++) {
      const tok = tokens[i].toUpperCase();

      if (!startingDomain) {
        if (DOMAIN_CODE_SET.has(tok)) {
          startingDomain = tok as DomainCode;
          continue;
        }
        if (SHORTHAND_MAP[tok]) {
          startingDomain = SHORTHAND_MAP[tok];
          continue;
        }
      }

      // strip non-digit punctuation (e.g. parentheses) before testing numeric
      const digits = tokens[i].replace(/[^\d-]/g, '');
      const n = Number(digits);
      if (!startingLevel && Number.isFinite(n) && n > 0) {
        startingLevel = Math.trunc(n);
        continue;
      }
    }

    const baseUsername = buildUsernameBase(firstName, lastName);
    if (!baseUsername) continue;

    const username = makeUniqueUsername(baseUsername, taken);
    taken.add(username.toLowerCase());

    rows.push({
      name: displayName,
      firstName,
      lastName,
      username,
      ...(startingDomain ? { startingDomain } : {}),
      ...(startingLevel ? { startingLevel } : {}),
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
