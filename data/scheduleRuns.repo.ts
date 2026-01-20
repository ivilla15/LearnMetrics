import { prisma } from '@/data/prisma';

export async function findRunByScheduleAndDate(params: { scheduleId: number; runDate: Date }) {
  const { scheduleId, runDate } = params;
  return prisma.assignmentScheduleRun.findUnique({
    where: {
      scheduleId_runDate: { scheduleId, runDate },
    },
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

export async function attachAssignmentToRun(params: { runId: number; assignmentId: number }) {
  const { runId, assignmentId } = params;

  return prisma.assignmentScheduleRun.update({
    where: { id: runId },
    data: { assignmentId },
  });
}
