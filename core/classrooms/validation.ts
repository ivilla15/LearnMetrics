export function clampClassroomName(raw: unknown) {
  const name = String(raw ?? '').trim();
  if (!name) return { ok: false as const, error: 'Classroom name is required.' };
  if (name.length > 80) return { ok: false as const, error: 'Classroom name must be ≤ 80 chars.' };
  return { ok: true as const, name };
}
