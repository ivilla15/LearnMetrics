import { prisma } from '@/data/prisma';
import type { OperationCode } from '@/types/enums';

export async function sumPracticeSecondsInWindow(params: {
  studentId: number;
  start: Date;
  end: Date;
  operation: OperationCode | null;
}): Promise<number> {
  const { studentId, start, end, operation } = params;

  const rows = await prisma.practiceSession.findMany({
    where: {
      studentId,
      startedAt: { lt: end },
      endedAt: { not: null, gt: start },
      ...(operation ? { operationAtTime: operation } : {}),
    },
    select: {
      startedAt: true,
      endedAt: true,
      durationSeconds: true,
    },
  });

  let total = 0;

  for (const r of rows) {
    if (!r.endedAt) continue;
    const dur = Number(r.durationSeconds);
    if (Number.isFinite(dur) && dur > 0) {
      total += dur;
      continue;
    }

    const clippedStart = Math.max(r.startedAt.getTime(), start.getTime());
    const clippedEnd = Math.min(r.endedAt.getTime(), end.getTime());
    if (clippedEnd > clippedStart) {
      total += Math.floor((clippedEnd - clippedStart) / 1000);
    }
  }

  return total;
}
