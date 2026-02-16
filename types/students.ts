import { OperationCode } from './progression';

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
  level: number;
  email?: string;
};

export type NextAssignmentDTO = {
  id: number;
  kind: string;
  mode: 'SCHEDULED' | 'MANUAL';
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
} | null;

export type AssignmentStatus = 'NOT_OPEN' | 'CLOSED' | 'READY' | 'ALREADY_SUBMITTED' | null;

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
