import type { OperationCode } from './progression';

export type BulkCreateStudentArgs = {
  teacherId: number;
  classroomId: number;
  students: {
    firstName: string;
    lastName: string;
    username: string;
    level: number;
    startingOperation?: OperationCode;
    startingLevel?: number;
  }[];
};

export type MeDTO = {
  id: number;
  name: string;
  username: string;
  classroomId: number;
};

export type NextAssignmentDTO = {
  id: number;
  type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
  opensAt: string;
  closesAt: string | null;
  windowMinutes: number | null;
  numQuestions: number;
} | null;

export type AssignmentStatus = 'NOT_OPEN' | 'CLOSED' | 'READY' | 'ALREADY_SUBMITTED' | null;

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

export function isNextAssignment(value: unknown): value is NextAssignmentDTO {
  if (value === null) return true;
  if (!value || typeof value !== 'object') return false;

  const v = value as Record<string, unknown>;

  const typeOk =
    v.type === 'TEST' ||
    v.type === 'PRACTICE' ||
    v.type === 'REMEDIATION' ||
    v.type === 'PLACEMENT';

  const modeOk = v.mode === 'SCHEDULED' || v.mode === 'MAKEUP' || v.mode === 'MANUAL';

  const closesAtOk = v.closesAt === null || typeof v.closesAt === 'string';

  const windowMinutesOk = v.windowMinutes === null || typeof v.windowMinutes === 'number';

  return (
    typeof v.id === 'number' &&
    Number.isFinite(v.id) &&
    typeOk &&
    modeOk &&
    typeof v.opensAt === 'string' &&
    closesAtOk &&
    windowMinutesOk &&
    typeof v.numQuestions === 'number' &&
    Number.isFinite(v.numQuestions)
  );
}
