import type { OperationCode } from '@/types/enums';

export type GeneratedQuestionDTO = {
  id: number;
  operation: OperationCode;
  operandA: number;
  operandB: number;
};

export type GradeItemDTO = {
  id: number;
  prompt: string;
  studentAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
};

export type GradeResultDTO = {
  total: number;
  score: number;
  percent: number;
  items: GradeItemDTO[];
};
