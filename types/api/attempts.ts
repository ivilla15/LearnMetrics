import type { AssignmentMode, AssignmentType, OperationCode } from '@/types/enums';
import type { AnswerValue } from './question';
import type { AttemptReviewStatus } from './assignments';

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
  // Phase 4: domain snapshot from the attempt; null for pre-Phase-3 attempts.
  domain?: string | null;
  levelAtTime: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
  reviewStatus?: AttemptReviewStatus | null;
  eventCount?: number;
};

export type AttemptDetailItemDTO = {
  id: number;
  prompt: string;
  studentAnswer: AnswerValue | null;
  correctAnswer: AnswerValue;
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

  operation?: OperationCode;
  // Phase 4: domain snapshot from the attempt; null for pre-Phase-3 attempts.
  domain?: string | null;
  type?: AssignmentType;

  score: number | null;
  total: number | null;
  percent: number | null;
  missed: number | null;

  wasMastery: boolean | null;
  levelAtTime: number | null;

  reviewStatus?: AttemptReviewStatus | null;
  eventCount?: number;
};
