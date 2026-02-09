export type AssignmentStatusFilter = 'all' | 'open' | 'closed' | 'upcoming';

export type TeacherAssignmentStats = {
  attemptedCount: number;
  totalStudents: number;
  masteryRate: number;
  avgPercent: number;
};

export type TeacherAssignmentListItem = {
  assignmentId: number;
  kind: string;
  assignmentMode: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  numQuestions: number;
  stats: TeacherAssignmentStats;
};

export type TeacherAssignmentsListResponse = {
  classroom: { id: number; name: string };
  rows: TeacherAssignmentListItem[];
  nextCursor: string | null;
};

export type AssignModalStudentRow = {
  id: number;
  name: string;
  username: string;
  flags?: { missedLastTest?: boolean; needsSetup?: boolean };
};

export type AssignModalLastMeta = {
  numQuestions?: number;
  windowMinutes?: number | null;
  questionSetId?: number | null;
};

export type AssignModalBootstrapResponse = {
  students?: AssignModalStudentRow[];
  recent?: {
    last3Tests?: Array<{
      numQuestions: number;
    }>;
  };
};

export type TeacherAssignmentAttemptRow = {
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
    kind: string;
    assignmentMode: string;
    opensAt: string;
    closesAt: string;
    windowMinutes: number | null;
    numQuestions: number;
  };
  rows: TeacherAssignmentAttemptRow[];
};

export type AssignmentAttemptsFilter = 'ALL' | 'MASTERY' | 'NOT_MASTERY' | 'MISSING';

export type AttemptDetailSelection = {
  studentId: number;
  attemptId: number;
  studentName: string;
  studentUsername: string;
};
