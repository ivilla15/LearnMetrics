import type { AttemptExplorerMe } from '@/types/attempts';

function toNumberId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function parseMeCandidate(value: unknown): AttemptExplorerMe | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;

  const id =
    toNumberId(v.id) ?? toNumberId(v.studentId) ?? toNumberId(v.userId) ?? toNumberId(v.student_id);

  const name = typeof v.name === 'string' ? v.name : null;
  const username = typeof v.username === 'string' ? v.username : null;

  if (!id || !name || !username) return null;
  return { id, name, username };
}

function pickCandidate(root: Record<string, unknown> | null): unknown {
  if (!root) return null;

  return (
    root.student ??
    root.me ??
    root.data ??
    root.user ??
    root.profile ??
    root.result ??
    (typeof root.student === 'object' && root.student
      ? ((root.student as Record<string, unknown>).student ?? root.student)
      : null) ??
    root
  );
}

export function parseMeFromApiResponse(data: unknown): AttemptExplorerMe | null {
  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
  const candidate = pickCandidate(root);
  return parseMeCandidate(candidate);
}
