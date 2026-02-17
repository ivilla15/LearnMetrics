import { z } from 'zod';
import { Modifier } from '@prisma/client';

export const operationSchema = z.enum(['ADD', 'SUB', 'MUL', 'DIV']);
export type OperationCode = z.infer<typeof operationSchema>;
export const ALL_OPS: OperationCode[] = ['ADD', 'SUB', 'MUL', 'DIV'];

export const modifierSchema = z.nativeEnum(Modifier);
export type ModifierCode = z.infer<typeof modifierSchema>;

export type StudentProgressLite = {
  operation: OperationCode;
  level: number;
};

export type ModifierRule = {
  modifier: ModifierCode;
  operations: OperationCode[];
  minLevel: number;
  propagate: boolean;
  enabled: boolean;
};

export type ProgressionPolicyInput = {
  enabledOperations: OperationCode[];
  operationOrder: OperationCode[];
  maxNumber: number;
  modifierRules: ModifierRule[];
};

export type ProgressionPolicyDTO = ProgressionPolicyInput & {
  classroomId: number;
  createdAt: Date;
  updatedAt: Date;
};

export type BulkStudentInput = {
  firstName: string;
  lastName: string;
  username: string;
  level: number;
  startingOperation?: OperationCode;
  startingLevel?: number;
};

export function getLevelForOp(
  progress: StudentProgressLite[] | undefined,
  op: OperationCode,
): number {
  if (!progress) return 1;
  const row = progress.find((r) => r.operation === op);
  return row?.level ?? 1;
}
