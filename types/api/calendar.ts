import type {
  AssignmentMode,
  AssignmentType,
  AssignmentTargetKind,
  OperationCode,
} from '@/types/enums';

export type CalendarAssignmentStatsDTO = {
  attemptedCount: number;
  totalStudents: number;
  masteryRate: number | null;
  avgPercent: number | null;
};

export type CalendarAssignmentRowDTO = {
  kind: 'assignment';
  assignmentId: number;
  type: AssignmentType;
  mode: AssignmentMode;

  opensAt: string;
  closesAt: string | null;

  windowMinutes: number | null;
  numQuestions: number;

  operation: OperationCode | null;

  stats?: CalendarAssignmentStatsDTO;
  scheduleId?: number | null;
  runDate?: string | null;
};

export type CalendarProjectionRowDTO = {
  kind: 'projection';
  scheduleId: number;
  runDate: string;

  opensAt: string;
  closesAt: string;

  mode: AssignmentMode;
  targetKind: AssignmentTargetKind;

  type: AssignmentType | null;
  numQuestions: number | null;
  windowMinutes: number | null;
  operation: OperationCode | null;

  durationMinutes: number | null;
};

export type CalendarItemRowDTO = CalendarAssignmentRowDTO | CalendarProjectionRowDTO;

export type CalendarAssignmentsListResponse = {
  classroom: { id: number; name: string; timeZone?: string | null };
  rows: CalendarAssignmentRowDTO[];
  projections: CalendarProjectionRowDTO[];
  nextCursor: string | null;
};
