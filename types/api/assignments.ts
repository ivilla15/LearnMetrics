import type {
  AssignmentMode,
  AssignmentType,
  AssignmentTargetKind,
  OperationCode,
  AssignmentListFilter,
  AttemptRowDTO,
} from '@/types';
import type { AnswerValue, OperandValue } from './question';

export type AssignmentCoreDTO = {
  id: number;
  classroomId: number;

  type: AssignmentType;
  mode: AssignmentMode;
  targetKind: AssignmentTargetKind;

  opensAt: string;
  closesAt: string | null;

  windowMinutes: number | null;

  numQuestions: number;

  durationMinutes: number | null;

  requiredSets: number | null;
  minimumScorePercent: number | null;

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
  targetKind: AssignmentTargetKind;

  status: 'FINISHED' | 'OPEN' | 'UPCOMING';

  opensAt: string;
  closesAt: string | null;

  windowMinutes: number | null;

  numQuestions: number;
  durationMinutes: number | null;

  requiredSets: number | null;
  minimumScorePercent: number | null;

  scheduleId: number | null;
  runDate: string | null;

  stats: {
    attemptedCount: number;
    totalStudents: number;
    masteryRate: number | null;
    avgPercent: number | null;
    /** Count of FLAGGED or INVALIDATED attempts for this assignment. */
    flaggedCount: number;
    /** Total AttemptEvent count for this assignment (any integrity signal, before review). */
    integrityEventCount: number;
  };
};

export type TeacherAssignmentsListResponse = {
  classroom: { id: number; name: string; timeZone?: string | null };
  rows: TeacherAssignmentListItemDTO[];
  nextCursor: string | null;
  projections?: unknown;
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

export type AttemptReviewStatus = 'VALID' | 'FLAGGED' | 'INVALIDATED';

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

  reviewStatus: AttemptReviewStatus | null;
  eventCount: number;
};

export type TeacherAssignmentAttemptsResponse = {
  assignment: {
    assignmentId: number;

    type: AssignmentType;
    mode: AssignmentMode;
    targetKind: AssignmentTargetKind;

    opensAt: string;
    closesAt: string | null;

    windowMinutes: number | null;

    numQuestions: number;
    durationMinutes: number | null;

    requiredSets: number | null;
    minimumScorePercent: number | null;
  };
  rows: TeacherAssignmentAttemptRowDTO[];
};

export type TeacherAttemptDetailItemDTO = {
  id: number;
  operation: OperationCode;
  operandA: OperandValue;
  operandB: OperandValue;
  correctAnswer: AnswerValue;
  studentAnswer: AnswerValue | null;
  isCorrect: boolean;
};

export type TeacherAttemptDetailResponse = {
  attemptId: number;
  completedAt: string | null;

  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;

  student: {
    id: number;
    name: string;
    username: string;
  };

  assignment: {
    assignmentId: number;

    type: AssignmentType;
    mode: AssignmentMode;
    targetKind: AssignmentTargetKind;

    opensAt: string;
    closesAt: string | null;

    windowMinutes: number | null;

    numQuestions: number;
    durationMinutes: number | null;
  };

  items: TeacherAttemptDetailItemDTO[];
};

export type StudentAssignmentListItemDTO = {
  assignmentId: number;

  type: AssignmentType;
  mode: AssignmentMode;
  targetKind: AssignmentTargetKind;

  status: AssignmentListFilter;

  opensAt: string;
  closesAt: string | null;

  windowMinutes: number | null;

  numQuestions: number;
  durationMinutes: number | null;

  requiredSets: number | null;
  minimumScorePercent: number | null;

  scheduleId: number | null;
  runDate: string | null;

  latestAttempt: AttemptRowDTO | null;
};

export type StudentAssignmentsListResponse = {
  classroom: { id: number; name: string; timeZone?: string | null };
  rows: StudentAssignmentListItemDTO[];
  nextCursor: string | null;
};

export type ScheduledOccurrenceDetailsDTO = {
  scheduleId: number;
  classroomId: number;
  classroomTimeZone: string;
  runDate: string;

  isActive: boolean;
  isSkipped: boolean;
  skippedAt: string | null;
  skipReason: string | null;

  mode: AssignmentMode;
  targetKind: AssignmentTargetKind;
  type: AssignmentType | null;

  opensAt: string;
  closesAt: string | null;

  windowMinutes: number | null;
  numQuestions: number | null;
  durationMinutes: number | null;

  existingAssignmentId: number | null;
};
