import { prisma } from '@/data/prisma';

export async function findRunByScheduleAndDate(params: { scheduleId: number; runDate: Date }) {
  const { scheduleId, runDate } = params;
  return prisma.assignmentScheduleRun.findUnique({
    where: { scheduleId_runDate: { scheduleId, runDate } },
  });
}

export async function createRun(params: {
  scheduleId: number;
  runDate: Date;
  assignmentId?: number | null;
}) {
  const { scheduleId, runDate, assignmentId = null } = params;

  return prisma.assignmentScheduleRun.create({
    data: { scheduleId, runDate, assignmentId },
  });
}

export async function attachAssignmentToRun(params: {
  runId: number;
  assignmentId: number | null;
}) {
  const { runId, assignmentId } = params;

  return prisma.assignmentScheduleRun.update({
    where: { id: runId },
    data: { assignmentId },
  });
}

export async function upsertSkippedRun(params: {
  scheduleId: number;
  runDate: Date;
  skipReason: string;
}) {
  return prisma.assignmentScheduleRun.upsert({
    where: { scheduleId_runDate: { scheduleId: params.scheduleId, runDate: params.runDate } },
    update: {
      isSkipped: true,
      skippedAt: new Date(),
      skipReason: params.skipReason,
      assignmentId: null,
    },
    create: {
      scheduleId: params.scheduleId,
      runDate: params.runDate,
      isSkipped: true,
      skippedAt: new Date(),
      skipReason: params.skipReason,
      assignmentId: null,
    },
  });
}
