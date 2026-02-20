import type { AssignmentMode, AssignmentType } from '@/types/enums';

export type AssignmentCoreDTO = {
  id: number;
  classroomId: number;

  type: AssignmentType;
  mode: AssignmentMode;

  opensAt: string;
  closesAt: string | null;

  windowMinutes: number | null;
  numQuestions: number;

  scheduleId: number | null;
  runDate: string | null;
};

export type TeacherAssignmentStatsDTO = {
  attemptedCount: number;
  totalStudents: number;
  masteryRate: number | null;
  avgPercent: number | null;
};

export type TeacherAssignmentListItemDTO = {
  assignmentId: number;
  type: AssignmentType;
  mode: AssignmentMode;
  status: 'FINISHED' | 'OPEN' | 'UPCOMING';
  opensAt: string;
  closesAt: string | null;
  numQuestions: number;
  scheduleId: number | null;
  runDate: string | null;
  stats: {
    attemptedCount: number;
    totalStudents: number;
    masteryRate: number | null;
    avgPercent: number | null;
  };
};

export type TeacherAssignmentsListResponse = {
  classroom: { id: number; name: string; timeZone?: string | null };
  rows: TeacherAssignmentListItemDTO[];
  nextCursor: string | null;
  projections?: unknown; // calendar endpoint owns projection type
};

export type AssignModalStudentRowDTO = {
  id: number;
  name: string;
  username: string;
  flags?: { missedLastTest?: boolean; needsSetup?: boolean };
};

export type AssignModalBootstrapResponse = {
  students: AssignModalStudentRowDTO[];
  recent?: {
    last3Tests?: Array<{ numQuestions: number }>;
  };
};

export type TeacherAssignmentAttemptRowDTO = {
  studentId: number;
  name: string;
  username: string;

  attemptId: number | null;
  completedAt: string | null;

  score: number | null;
  total: number | null;
  percent: number | null;
  missed: number | null;

  wasMastery: boolean | null;
  levelAtTime: number | null;
};

export type TeacherAssignmentAttemptsResponse = {
  assignment: {
    assignmentId: number;
    type: AssignmentType;
    mode: AssignmentMode;
    opensAt: string;
    closesAt: string | null;
    windowMinutes: number | null;
    numQuestions: number;
  };
  rows: TeacherAssignmentAttemptRowDTO[];
};
