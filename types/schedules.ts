export type ScheduleDTO = {
  id: number;
  classroomId: number;

  name?: string | null;
  isPrimary?: boolean;

  opensAtLocalTime: string; // "08:00"
  windowMinutes: number;
  numQuestions: number;

  days: string[]; // ["Friday", "Tuesday", ...]
  isActive: boolean;
};

export type ClassroomSchedulesResponse = {
  schedules: ScheduleDTO[];
};

export type CreateScheduleArgs = {
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive: boolean;
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

export type ScheduleGate =
  | { ok: true }
  | {
      ok: false;
      reason: 'TRIAL_LIMIT_REACHED' | 'SUBSCRIPTION_CANCELED' | 'SUBSCRIPTION_EXPIRED';
      message: string;
      upgradeHref: string;
    };
