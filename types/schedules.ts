export type ClassroomSchedulesResponse = {
  schedules: ScheduleDTO[];
};

export type ScheduleDTO = {
  id: number;

  name?: string | null;
  isPrimary?: boolean;

  dayOfWeek: number;
  timeOfDay: string;
  windowMinutes: number;
  numQuestions: number;

  isEnabled?: boolean;
};

export type CreateScheduleArgs = {
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive?: boolean;
  days: string[];
  numQuestions: number;
};

export type UpdateScheduleArgs = {
  id: number;
  opensAtLocalTime?: string;
  windowMinutes?: number;
  isActive?: boolean;
  days?: string[];
  numQuestions?: number;
};
