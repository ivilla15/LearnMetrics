import type { AttemptRow, MeDTO, NextAssignmentDTO } from '@/types';

export function isMeDTO(value: unknown): value is MeDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.id === 'number' &&
    Number.isFinite(v.id) &&
    typeof v.name === 'string' &&
    v.name.length > 0 &&
    typeof v.username === 'string' &&
    v.username.length > 0 &&
    typeof v.classroomId === 'number' &&
    Number.isFinite(v.classroomId)
  );
}

export function isNextAssignment(value: unknown): value is Exclude<NextAssignmentDTO, null> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  const typeOk =
    v.type === 'TEST' ||
    v.type === 'PRACTICE' ||
    v.type === 'REMEDIATION' ||
    v.type === 'PLACEMENT';

  const modeOk = v.mode === 'SCHEDULED' || v.mode === 'MAKEUP' || v.mode === 'MANUAL';

  const closesOk = v.closesAt === null || typeof v.closesAt === 'string';
  const windowOk = v.windowMinutes === null || typeof v.windowMinutes === 'number';

  return (
    typeof v.id === 'number' &&
    Number.isFinite(v.id) &&
    typeOk &&
    modeOk &&
    typeof v.opensAt === 'string' &&
    closesOk &&
    windowOk &&
    typeof v.numQuestions === 'number' &&
    Number.isFinite(v.numQuestions)
  );
}

export function isAttemptRow(value: unknown): value is AttemptRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  const typeOk =
    v.type === 'TEST' ||
    v.type === 'PRACTICE' ||
    v.type === 'REMEDIATION' ||
    v.type === 'PLACEMENT';

  const modeOk = v.mode === 'SCHEDULED' || v.mode === 'MAKEUP' || v.mode === 'MANUAL';

  return (
    typeof v.attemptId === 'number' &&
    Number.isFinite(v.attemptId) &&
    typeof v.assignmentId === 'number' &&
    Number.isFinite(v.assignmentId) &&
    (v.completedAt === null || typeof v.completedAt === 'string') &&
    typeOk &&
    modeOk &&
    (v.levelAtTime === null || typeof v.levelAtTime === 'number') &&
    typeof v.score === 'number' &&
    typeof v.total === 'number' &&
    typeof v.percent === 'number' &&
    typeof v.wasMastery === 'boolean'
  );
}

export function statusFor(a: NextAssignmentDTO) {
  if (!a) return { label: 'No upcoming tests', canStart: false };

  const now = Date.now();
  const opens = new Date(a.opensAt).getTime();
  const closes = a.closesAt ? new Date(a.closesAt).getTime() : null;

  if (Number.isNaN(opens)) return { label: 'Not available', canStart: false };
  if (now < opens) return { label: 'Not open yet', canStart: false };

  if (closes !== null) {
    if (Number.isNaN(closes)) return { label: 'Not available', canStart: false };
    if (now > closes) return { label: 'Closed', canStart: false };
  }

  return { label: 'Open now', canStart: true };
}
