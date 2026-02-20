import type { AssignmentMode, AssignmentType, OperationCode } from '@/types/enums';

export type AttemptSummaryDTO = {
  id: number;
  assignmentId: number;
  score: number;
  total: number;
  completedAt: string; // ISO
};

export type AttemptRowDTO = {
  attemptId: number;
  assignmentId: number;
  completedAt: string; // ISO
  type: AssignmentType;
  mode: AssignmentMode;
  operation: OperationCode;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
};

export type AttemptDetailItemDTO = {
  id: number;
  prompt: string;
  studentAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
};

export type AttemptDetailDTO = {
  attemptId: number;
  completedAt: string;
  operation: OperationCode;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
  assignment?: {
    type: AssignmentType;
    mode: AssignmentMode;
    opensAt: string;
    closesAt: string | null;
    windowMinutes: number | null;
  };
  items: AttemptDetailItemDTO[];
};

export type AttemptResultsRowDTO = {
  studentId?: number;
  name?: string;
  username?: string;

  attemptId: number | null;
  completedAt: string | null;

  score: number | null;
  total: number | null;
  percent: number | null;
  missed: number | null;

  wasMastery: boolean | null;
  levelAtTime: number | null;
};
