import z from 'zod';

export const operationSchema = z.enum(['ADD', 'SUB', 'MUL', 'DIV']);
export type OperationCode = 'ADD' | 'SUB' | 'MUL' | 'DIV';
export const ALL_OPS: OperationCode[] = ['ADD', 'SUB', 'MUL', 'DIV'];
export type BulkStudentInput = {
  firstName: string;
  lastName: string;
  username: string;
  level: number;
  startingOperation?: 'ADD' | 'SUB' | 'MUL' | 'DIV';
  startingLevel?: number;
};

export type StudentProgressLite = {
  operation: OperationCode;
  level: number;
};

export type ProgressionPolicyInput = {
  enabledOperations: OperationCode[];
  maxNumber: number;
  allowDecimals: boolean;
  allowFractions: boolean;
  divisionIntegersOnly: boolean;
};

export function getLevelForOp(
  progress: StudentProgressLite[] | undefined,
  op: OperationCode,
): number {
  if (!progress) return 1;
  const row = progress.find((r) => r.operation === op);
  return row?.level ?? 1;
}

export type ProgressionPolicyDTO = {
  classroomId: number;
  enabledOperations: OperationCode[];
  maxNumber: number;
  divisionIntegersOnly: boolean;
  createdAt: string;
  updatedAt: string;
};

export type StudentProgressRowDTO = {
  operation: OperationCode;
  level: number;
};
