// src/utils/studentDashboard.ts

import type { AttemptRow, MeDTO, NextAssignmentDTO } from '@/types';

export function isMeDTO(value: unknown): value is MeDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'number' &&
    typeof v.name === 'string' &&
    typeof v.username === 'string' &&
    typeof v.level === 'number'
  );
}

export function isNextAssignment(value: unknown): value is Exclude<NextAssignmentDTO, null> {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  const modeOk = v.mode === 'SCHEDULED' || v.mode === 'MANUAL';
  const windowOk = v.windowMinutes === null || typeof v.windowMinutes === 'number';

  return (
    typeof v.id === 'number' &&
    typeof v.kind === 'string' &&
    modeOk &&
    typeof v.opensAt === 'string' &&
    typeof v.closesAt === 'string' &&
    windowOk
  );
}

export function isAttemptRow(value: unknown): value is AttemptRow {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.attemptId === 'number' &&
    typeof v.assignmentId === 'number' &&
    typeof v.completedAt === 'string' &&
    typeof v.assignmentKind === 'string' &&
    typeof v.assignmentMode === 'string' &&
    typeof v.levelAtTime === 'number' &&
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
  const closes = new Date(a.closesAt).getTime();

  if (now < opens) return { label: 'Not open yet', canStart: false };
  if (now > closes) return { label: 'Closed', canStart: false };
  return { label: 'Open now', canStart: true };
}
