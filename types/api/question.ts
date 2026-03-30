import type { ModifierCode, OperationCode } from '@/types/enums';

// Operand shapes

export type IntegerOperand = {
  kind: 'integer';
  value: number;
};

export type DecimalOperand = {
  kind: 'decimal';
  value: number;
};

export type FractionOperand = {
  kind: 'fraction';
  numerator: number;
  denominator: number;
};

export type OperandValue = IntegerOperand | DecimalOperand | FractionOperand;

// Answer shapes (what the student submits and what the correct answer is)

export type DecimalAnswer = {
  kind: 'decimal';
  value: number;
};

export type FractionAnswer = {
  kind: 'fraction';
  numerator: number;
  denominator: number;
};

export type AnswerValue = DecimalAnswer | FractionAnswer;

// Grader policy for fraction answer acceptance

export type FractionAnswerMode = 'improper-only' | 'mixed-only' | 'both';

// DTOs

export type GeneratedQuestionDTO = {
  id: number;
  operation: OperationCode;
  operandA: OperandValue;
  operandB: OperandValue;
  modifier: ModifierCode | null;
};

export type GradeItemDTO = {
  id: number;
  prompt: string;
  studentAnswer: AnswerValue | null;
  correctAnswer: AnswerValue;
  isCorrect: boolean;
};

export type GradeResultDTO = {
  total: number;
  score: number;
  percent: number;
  items: GradeItemDTO[];
};
