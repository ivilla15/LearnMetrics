import type { AttemptRowDTO, StudentMeDTO, StudentNextAssignmentDTO, TeacherMeDTO } from '@/types';

export function isStudentMeDTO(value: unknown): value is StudentMeDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  const progress = v.progress;
  const progressOk: boolean =
    !!progress &&
    typeof progress === 'object' &&
    typeof (progress as Record<string, unknown>).operation === 'string' &&
    typeof (progress as Record<string, unknown>).level === 'number';

  return (
    typeof v.id === 'number' &&
    typeof v.name === 'string' &&
    typeof v.username === 'string' &&
    typeof v.classroomId === 'number' &&
    progressOk
  );
}

export function isStudentNextAssignmentDTO(value: unknown): value is StudentNextAssignmentDTO {
  if (value === null) return true;
  if (!value || typeof value !== 'object') return false;

  const v = value as Record<string, unknown>;

  const closesAtOk = v.closesAt === null || typeof v.closesAt === 'string';
  const windowMinutesOk = v.windowMinutes === null || typeof v.windowMinutes === 'number';

  return (
    typeof v.id === 'number' &&
    typeof v.type === 'string' &&
    typeof v.mode === 'string' &&
    typeof v.opensAt === 'string' &&
    closesAtOk &&
    windowMinutesOk &&
    typeof v.numQuestions === 'number'
  );
}

export function isAttemptRowDTO(value: unknown): value is AttemptRowDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return (
    typeof v.attemptId === 'number' &&
    typeof v.assignmentId === 'number' &&
    typeof v.completedAt === 'string' &&
    typeof v.type === 'string' &&
    typeof v.mode === 'string' &&
    typeof v.score === 'number' &&
    typeof v.total === 'number' &&
    typeof v.percent === 'number' &&
    typeof v.wasMastery === 'boolean'
  );
}

export function isTeacherMeDTO(value: unknown): value is TeacherMeDTO {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;

  return typeof v.id === 'number' && typeof v.name === 'string' && typeof v.email === 'string';
}
