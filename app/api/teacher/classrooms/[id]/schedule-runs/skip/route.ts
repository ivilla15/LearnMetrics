import { prisma } from '@/data/prisma';
import { getTeacherClassroomParams, handleApiError } from '@/app/api/_shared';
import { jsonResponse, errorResponse } from '@/utils';
import { readJson, type RouteContext } from '@/app';
import { skipScheduleRunSchema } from '@/validation';

export async function POST(request: Request, { params }: RouteContext<{ id: string }>) {
  try {
    const ctx = await getTeacherClassroomParams(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const input = skipScheduleRunSchema.parse(body);

    const schedule = await prisma.assignmentSchedule.findFirst({
      where: { id: input.scheduleId, classroomId: ctx.classroomId },
      select: { id: true },
    });
    if (!schedule) return errorResponse('Schedule not found', 404);

    const runDate = new Date(input.runDate);
    if (Number.isNaN(runDate.getTime())) return errorResponse('Invalid runDate', 400);

    const existingRun = await prisma.assignmentScheduleRun.findUnique({
      where: { scheduleId_runDate: { scheduleId: input.scheduleId, runDate } },
      select: { id: true, assignmentId: true },
    });

    if (existingRun?.assignmentId) {
      const attemptsCount = await prisma.attempt.count({
        where: { assignmentId: existingRun.assignmentId },
      });

      if (attemptsCount > 0) {
        return errorResponse(
          'Cannot cancel this occurrence because students have already attempted it.',
          409,
        );
      }

      await prisma.assignment.delete({ where: { id: existingRun.assignmentId } });
    }

    const now = new Date();

    const run = await prisma.assignmentScheduleRun.upsert({
      where: { scheduleId_runDate: { scheduleId: input.scheduleId, runDate } },
      create: {
        scheduleId: input.scheduleId,
        runDate,
        isSkipped: true,
        skippedAt: now,
        skipReason: input.reason ?? null,
        assignmentId: null,
      },
      update: {
        isSkipped: true,
        skippedAt: now,
        skipReason: input.reason ?? null,
        assignmentId: null,
      },
      select: {
        id: true,
        scheduleId: true,
        runDate: true,
        isSkipped: true,
        skippedAt: true,
        skipReason: true,
      },
    });

    return jsonResponse({ scheduleRun: { ...run, runDate: run.runDate.toISOString() } }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
