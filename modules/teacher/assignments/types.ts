export type TeacherAssignmentListItem = {
  assignmentId: number;
  kind: string;
  assignmentMode: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  numQuestions: number;
  stats: {
    attemptedCount: number;
    totalStudents: number;
    masteryRate: number;
    avgPercent: number;
  };
};

export type TeacherAssignmentsListResponse = {
  classroom: { id: number; name: string };
  rows: TeacherAssignmentListItem[];
  nextCursor: string | null;
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

export type AssignmentStatusFilter = 'all' | 'open' | 'closed' | 'upcoming';
