import type { AssignmentType, AssignmentTargetKind, RecipientRule } from '@/types/enums';

export type ScheduleDTO = {
  id: number;
  classroomId: number;

  opensAtLocalTime: string;
  windowMinutes: number;
  days: string[];
  isActive: boolean;

  targetKind: AssignmentTargetKind;

  // type is a sub-classification only meaningful for ASSESSMENT schedules
  type: AssignmentType | null;

  numQuestions: number;
  durationMinutes: number | null;
  requiredSets: number | null;
  minimumScorePercent: number | null;

  recipientRule: RecipientRule;
};

export type ClassroomSchedulesResponse = {
  schedules: ScheduleDTO[];
};
