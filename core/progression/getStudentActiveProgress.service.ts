import type { OperationCode } from '@/types/enums';
import type { ProgressionSnapshotDTO } from '@/types/api/progression';
import * as StudentProgressRepo from '@/data';

function computeActiveOpAndLevel(params: {
  progress: Array<{ operation: OperationCode; level: number }>;
  snapshot: ProgressionSnapshotDTO;
}): { operation: OperationCode; level: number } {
  const { progress, snapshot } = params;

  const order =
    snapshot.operationOrder.length > 0
      ? snapshot.operationOrder
      : snapshot.enabledOperations.length > 0
        ? snapshot.enabledOperations
        : (['MUL'] as const);

  const byOp = new Map<OperationCode, number>();
  for (const row of progress) byOp.set(row.operation, row.level);

  for (const op of order) {
    const lvl = byOp.get(op) ?? 1;
    if (lvl < snapshot.maxNumber) return { operation: op, level: lvl };
  }

  const last = order[order.length - 1] ?? 'MUL';
  return { operation: last, level: byOp.get(last) ?? snapshot.maxNumber };
}

export async function getStudentActiveProgress(params: {
  studentId: number;
  snapshot: ProgressionSnapshotDTO;
}): Promise<{ operation: OperationCode; level: number }> {
  const rows = await StudentProgressRepo.findByStudentId(params.studentId);
  return computeActiveOpAndLevel({ progress: rows, snapshot: params.snapshot });
}
