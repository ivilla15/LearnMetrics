import type { AssignmentMode, AssignmentType, OperationCode } from '@/types/enums';

export const ASSIGNMENT_TYPE_LABEL: Record<AssignmentType, string> = {
  TEST: 'Test',
  PRACTICE: 'Practice test',
  REMEDIATION: 'Remediation',
  PLACEMENT: 'Placement',
};

export const ASSIGNMENT_MODE_LABEL: Record<AssignmentMode, string> = {
  SCHEDULED: 'Scheduled',
  MAKEUP: 'Makeup',
  MANUAL: 'Manual',
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
