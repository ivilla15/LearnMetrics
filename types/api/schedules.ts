import type { AssignmentType } from '@/types/enums';

export type ScheduleDTO = {
  id: number;
  classroomId: number;

  name?: string | null;
  isPrimary?: boolean;

  opensAtLocalTime: string;
  windowMinutes: number;
  numQuestions: number;

  type: AssignmentType;

  days: string[];
  isActive: boolean;
};

export type ClassroomSchedulesResponse = {
  schedules: ScheduleDTO[];
};
