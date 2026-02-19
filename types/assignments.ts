export type AssignmentStatusFilter = 'all' | 'open' | 'finished' | 'upcoming';
export type AssignmentModeFilter = 'all' | 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
export type AssignmentTypeFilter = 'all' | 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';

export type TeacherAssignmentStats = {
  attemptedCount: number;
  totalStudents: number;
  masteryRate: number;
  avgPercent: number;
};

export type TeacherAssignmentListItem = {
  assignmentId: number;
  type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
  status: 'FINISHED' | 'OPEN' | 'UPCOMING';
  opensAt: string;
  closesAt: string | null;
  numQuestions?: number;
  stats: {
    attemptedCount: number;
    totalStudents: number;
    masteryRate?: number | null;
    avgPercent?: number | null;
  };
  scheduleId?: number | null;
  runDate?: string | null;
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
    mode: string;
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

export type AssignmentPayload = {
  id: number;
  type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
  opensAt: string;
  closesAt: string | null;
  windowMinutes: number | null;
  numQuestions: number;
};

export type StudentPayload = {
  id: number;
  name: string;
  operation: string;
  level: number | null;
};

export type AlreadySubmittedResult = {
  score: number;
  total: number;
  percent: number;
  completedAt: string;
};

export type QuestionPayload = {
  id: number;
  factorA: number;
  factorB: number;
};

export type LoadResponse =
  | { status: 'NOT_OPEN' | 'CLOSED'; assignment: AssignmentPayload }
  | { status: 'ALREADY_SUBMITTED'; assignment: AssignmentPayload; result: AlreadySubmittedResult }
  | {
      status: 'READY';
      student: StudentPayload;
      assignment: AssignmentPayload;
      questions: QuestionPayload[];
    };
