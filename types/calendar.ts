// types/calendar.ts
export type CalendarAssignmentStats = {
  attemptedCount: number;
  totalStudents: number;
  masteryRate: number;
  avgPercent: number;
};

export type CalendarAssignmentDTO = {
  kind: string; // e.g. "SCHEDULED_TEST"
  assignmentId: number;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  opensAt: string; // ISO
  closesAt: string; // ISO
  windowMinutes: number | null;
  numQuestions: number;
  stats?: CalendarAssignmentStats;
  scheduleId?: number | null;
  runDate?: string | null;
};

export type CalendarProjectionRow = {
  kind: 'projection';
  scheduleId: number;
  runDate: string; // ISO
  opensAt: string; // ISO UTC
  closesAt: string; // ISO UTC
  windowMinutes: number | null;
  numQuestions: number;
  assignmentMode: 'SCHEDULED';
};

export type CalendarAssignmentsListResponse = {
  classroom?: { id: number; name: string; timeZone?: string };
  rows: CalendarAssignmentDTO[];
  projections?: CalendarProjectionRow[];
  nextCursor: string | null;
};

// renamed to avoid collisions with existing CalendarItem
export type CalendarItemRow = CalendarAssignmentDTO | CalendarProjectionRow;
