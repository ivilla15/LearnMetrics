import type { AssignmentCoreDTO } from '@/types/api/assignments';
import type { AttemptRowDTO } from '@/types/api/attempts';
import type { StudentMeDTO } from '@/types/api/student';
import type { AssignmentMode, AssignmentType, OperationCode } from '@/types/enums';

const ASSIGNMENT_TYPES: readonly AssignmentType[] = [
  'TEST',
  'PRACTICE',
  'REMEDIATION',
  'PLACEMENT',
];
export const ASSIGNMENT_MODES: readonly AssignmentMode[] = ['SCHEDULED', 'MAKEUP', 'MANUAL'];
export const OPS: readonly OperationCode[] = ['ADD', 'SUB', 'MUL', 'DIV'];

function isString(v: unknown): v is string {
  return typeof v === 'string';
}

function isNumber(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function isAssignmentType(v: unknown): v is AssignmentType {
  return isString(v) && (ASSIGNMENT_TYPES as readonly string[]).includes(v);
}

function isAssignmentMode(v: unknown): v is AssignmentMode {
  return isString(v) && (ASSIGNMENT_MODES as readonly string[]).includes(v);
}

function isOperationCode(v: unknown): v is OperationCode {
  return isString(v) && (OPS as readonly string[]).includes(v);
}

export function isStudentMeDTO(value: unknown): value is StudentMeDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  const progress = v.progress;
  if (!progress || typeof progress !== 'object') return false;
  const p = progress as Record<string, unknown>;

  return (
    isNumber(v.id) &&
    isString(v.name) &&
    isString(v.username) &&
    isNumber(v.classroomId) &&
    isOperationCode(p.operation) &&
    isNumber(p.level)
  );
}

export function isAssignmentCoreDTO(value: unknown): value is AssignmentCoreDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  const closesAtOk = v.closesAt === null || isString(v.closesAt);
  const windowOk = v.windowMinutes === null || isNumber(v.windowMinutes);

  return (
    isNumber(v.id) &&
    isNumber(v.classroomId) &&
    isAssignmentType(v.type) &&
    isAssignmentMode(v.mode) &&
    isString(v.opensAt) &&
    closesAtOk &&
    windowOk &&
    isNumber(v.numQuestions) &&
    (v.scheduleId === null || isNumber(v.scheduleId)) &&
    (v.runDate === null || isString(v.runDate))
  );
}

export function isAttemptRowDTO(value: unknown): value is AttemptRowDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    isNumber(v.attemptId) &&
    isNumber(v.assignmentId) &&
    isString(v.completedAt) &&
    isAssignmentType(v.type) &&
    isAssignmentMode(v.mode) &&
    isOperationCode(v.operation) &&
    isNumber(v.levelAtTime) &&
    isNumber(v.score) &&
    isNumber(v.total) &&
    isNumber(v.percent) &&
    typeof v.wasMastery === 'boolean'
  );
}
