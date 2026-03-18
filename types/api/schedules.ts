import type {
  AssignmentType,
  AssignmentTargetKind,
  OperationCode,
  RecipientRule,
} from '@/types/enums';

export type ScheduleDTO = {
  id: number;
  classroomId: number;

  opensAtLocalTime: string;
  windowMinutes: number;
  days: string[];
  isActive: boolean;

  targetKind: AssignmentTargetKind;

  // nullable because PRACTICE_TIME schedules may not need it
  type: AssignmentType | null;

  numQuestions: number;
  durationMinutes: number | null;
  operation: OperationCode | null;

  dependsOnScheduleId: number | null;
  offsetMinutes: number;
  recipientRule: RecipientRule;
};

export type ClassroomSchedulesResponse = {
  schedules: ScheduleDTO[];
};

export type ScheduleGate = {
  ok: boolean;
  message: string;
  upgradeUrl?: string;
};
