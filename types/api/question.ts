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

// ---------------------------------------------------------------------------
// Runtime narrowing helpers
// These live here so every caller can import them instead of duplicating them.
// ---------------------------------------------------------------------------

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export function isOperandValue(value: unknown): value is OperandValue {
  if (!isObject(value) || typeof value.kind !== 'string') return false;
  if (value.kind === 'integer' || value.kind === 'decimal') {
    return typeof value.value === 'number' && Number.isFinite(value.value);
  }
  if (value.kind === 'fraction') {
    return (
      typeof value.numerator === 'number' &&
      Number.isFinite(value.numerator) &&
      typeof value.denominator === 'number' &&
      Number.isFinite(value.denominator) &&
      value.denominator !== 0
    );
  }
  return false;
}

export function isAnswerValue(value: unknown): value is AnswerValue {
  if (!isObject(value) || typeof value.kind !== 'string') return false;
  if (value.kind === 'decimal') {
    return typeof value.value === 'number' && Number.isFinite(value.value);
  }
  if (value.kind === 'fraction') {
    return (
      typeof value.numerator === 'number' &&
      Number.isFinite(value.numerator) &&
      typeof value.denominator === 'number' &&
      Number.isFinite(value.denominator) &&
      value.denominator !== 0
    );
  }
  return false;
}

export function parseOperandValue(value: unknown): OperandValue {
  if (isOperandValue(value)) return value;
  throw new Error('Expected OperandValue JSON object');
}

export function parseAnswerValue(value: unknown): AnswerValue {
  if (isAnswerValue(value)) return value;
  throw new Error('Expected AnswerValue JSON object');
}

/** Convert any OperandValue or AnswerValue to its numeric representation. */
export function extractNumericValue(value: OperandValue | AnswerValue): number {
  if (value.kind === 'integer' || value.kind === 'decimal') return value.value;
  return value.numerator / value.denominator;
}

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
