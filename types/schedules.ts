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
