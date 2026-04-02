import type { AssignmentMode, AssignmentType, OperationCode } from '@/types/enums';
import { AnswerValue, OperandValue } from '..';

export const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  TEST: 'Test',
  PRACTICE: 'Practice',
  REMEDIATION: 'Remediation',
  PLACEMENT: 'Placement',
};

export const ASSIGNMENT_MODE_LABEL: Record<AssignmentMode, string> = {
  SCHEDULED: 'Scheduled',
  MAKEUP: 'Makeup',
  MANUAL: 'Custom',
};

export const OPERATION_LABEL: Record<OperationCode, string> = {
  ADD: 'Addition',
  SUB: 'Subtraction',
  MUL: 'Multiplication',
  DIV: 'Division',
};

export function formatAssignmentType(type: AssignmentType) {
  return ASSIGNMENT_TYPE_LABEL[type];
}

export function formatAssignmentMode(mode: AssignmentMode) {
  return ASSIGNMENT_MODE_LABEL[mode];
}

export function formatOperation(op: OperationCode) {
  return OPERATION_LABEL[op];
}

export function opSymbol(op: OperationCode): string {
  switch (op) {
    case 'ADD':
      return '+';
    case 'SUB':
      return '−';
    case 'MUL':
      return '×';
    case 'DIV':
      return '÷';
  }
}

export function formatOperand(operand: OperandValue): string {
  switch (operand.kind) {
    case 'integer':
      return String(operand.value);
    case 'decimal':
      return String(operand.value);
    case 'fraction':
      return `${operand.numerator}/${operand.denominator}`;
  }
}

export function formatAnswer(answer: AnswerValue): string {
  switch (answer.kind) {
    case 'decimal':
      return String(answer.value);
    case 'fraction':
      return `${answer.numerator}/${answer.denominator}`;
  }
}
