export type AssignmentRow = {
  id: number;
  classroomId: number;
  kind: 'SCHEDULED_TEST';
  opensAt: Date;
  closesAt: Date;
  windowMinutes: number | null;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  numQuestions: number;
  _count: { recipients: number };
};

export type AssignmentDTO = {
  id: number;
  classroomId: number;
  kind: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  assignmentMode: 'SCHEDULED' | 'MANUAL';
  numQuestions: number;
  recipientCount: number;
};

export type AssignmentAttemptRow = {
  attemptId: number;
  studentId: number;
  studentName: string;
  studentUsername: string;
  completedAt: string;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
};

export type AssignmentAttemptDetail = {
  attemptId: number;
  studentId: number;
  studentName: string;
  studentUsername: string;
  completedAt: string;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
  assignment?: {
    kind: string;
    assignmentMode: string;
    opensAt: string;
    closesAt: string;
    windowMinutes: number | null;
    numQuestions?: number | null;
  };
  items: {
    id: number;
    prompt: string;
    studentAnswer: number;
    correctAnswer: number;
    isCorrect: boolean;
  }[];
};

export type ProjectionRow = {
  kind: 'projection';
  scheduleId: number;
  runDate: string;
  opensAt: string;
  closesAt: string;
  windowMinutes: number | null;
  numQuestions: number;
  assignmentMode: 'SCHEDULED';
};

export type CalendarItem = (AssignmentRow & { kind?: string }) | ProjectionRow;

export interface RosterDTO {
  classroom: { id: number; name: string; timeZone: string };
  students: {
    id: number;
    name: string;
    username: string;
    level: number;
    mustSetPassword: boolean;
    lastAttempt: {
      assignmentId: number;
      score: number;
      total: number;
      percent: number;
      completedAt: string;
      wasMastery: boolean;
    } | null;
  }[];
}

export type AssignmentsListResponse = {
  classroom?: { id: number; name: string; timeZone?: string };
  rows: AssignmentRow[];
  projections?: ProjectionRow[];
  nextCursor: string | null;
};
