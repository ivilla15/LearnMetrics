import { prisma } from '@/data/prisma';
import { getTeacherClassroomParams, handleApiError } from '@/app/api/_shared';
import { jsonResponse, errorResponse } from '@/utils';
import { readJson, type RouteContext } from '@/app';
import { unskipScheduleRunSchema } from '@/validation';

export async function POST(request: Request, { params }: RouteContext<{ id: string }>) {
  try {
    const ctx = await getTeacherClassroomParams(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const input = unskipScheduleRunSchema.parse(body);

    const schedule = await prisma.assignmentSchedule.findFirst({
      where: { id: input.scheduleId, classroomId: ctx.classroomId },
      select: { id: true },
    });
    if (!schedule) return errorResponse('Schedule not found', 404);

    const runDate = new Date(input.runDate);
    if (Number.isNaN(runDate.getTime())) return errorResponse('Invalid runDate', 400);

    const existing = await prisma.assignmentScheduleRun.findUnique({
      where: { scheduleId_runDate: { scheduleId: input.scheduleId, runDate } },
      select: { id: true, isSkipped: true },
    });
    if (!existing) return errorResponse('No schedule run found for that date', 404);

    const updated = await prisma.assignmentScheduleRun.update({
      where: { id: existing.id },
      data: { isSkipped: false, skippedAt: null, skipReason: null },
      select: {
        id: true,
        scheduleId: true,
        runDate: true,
        isSkipped: true,
        skippedAt: true,
        skipReason: true,
      },
    });

    return jsonResponse(
      { scheduleRun: { ...updated, runDate: updated.runDate.toISOString() } },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
