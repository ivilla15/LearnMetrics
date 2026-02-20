import type { OperationCode } from '@/types/enums';

export type PracticeQuestionDTO = {
  id: number;
  operation: OperationCode;
  factorA: number;
  factorB: number;
};

export type PracticeGradeItemDTO = {
  id: number;
  prompt: string;
  studentAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
};

export type PracticeGradeResultDTO = {
  total: number;
  score: number;
  percent: number;
  items: PracticeGradeItemDTO[];
};
