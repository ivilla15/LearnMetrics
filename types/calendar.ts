export type CalendarAssignmentStats = {
  attemptedCount: number;
  totalStudents: number;
  masteryRate: number;
  avgPercent: number;
};

export type CalendarAssignmentDTO = {
  kind: 'assignment';
  assignmentId: number;
  type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
  opensAt: string;
  closesAt: string | null;
  windowMinutes: number | null;
  numQuestions: number;
  stats?: CalendarAssignmentStats;
  scheduleId?: number | null;
  runDate?: string | null;
};

export type CalendarProjectionRow = {
  kind: 'projection';
  scheduleId: number;
  runDate: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  numQuestions: number;
  mode: 'SCHEDULED';
  type: 'TEST';
};

export type CalendarAssignmentsListResponse = {
  classroom?: { id: number; name: string; timeZone?: string };
  rows: CalendarAssignmentDTO[];
  projections?: CalendarProjectionRow[];
  nextCursor: string | null;
};

export type CalendarItemRow = CalendarAssignmentDTO | CalendarProjectionRow;
