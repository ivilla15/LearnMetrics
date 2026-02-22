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
