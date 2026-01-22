// app/api/teacher/classrooms/[id]/schedule-runs/skip/route.ts
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { errorResponse, jsonResponse, parseId } from '@/utils';
import { handleApiError, readJson, type RouteContext } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const classroomId = parseId((await params).id);
    if (!classroomId) return errorResponse('Invalid classroom id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    // typed body to avoid TS '{}' issues
    const body = (await readJson(req)) as {
      scheduleId?: number;
      runDate?: string;
      reason?: string;
    };

    const scheduleId = Number(body?.scheduleId);
    const runDateRaw = body?.runDate;
    const reason = typeof body?.reason === 'string' ? body.reason : 'Cancelled by teacher';

    if (!Number.isFinite(scheduleId) || scheduleId <= 0) {
      return errorResponse('Invalid scheduleId', 400);
    }
    if (!runDateRaw || isNaN(new Date(runDateRaw).getTime())) {
      return errorResponse('Invalid runDate', 400);
    }
    const runDate = new Date(runDateRaw);

    // Find existing run if any
    const existingRun = await prisma.assignmentScheduleRun.findUnique({
      where: { scheduleId_runDate: { scheduleId, runDate } },
      select: { id: true, assignmentId: true, isSkipped: true },
    });

    // If assignment attached -> ensure no attempts, then delete
    if (existingRun?.assignmentId) {
      const assignmentId = existingRun.assignmentId;
      const attempts = await prisma.attempt.count({ where: { assignmentId } });
      if (attempts > 0) {
        return errorResponse(
          'Cannot cancel this occurrence because students have already attempted it.',
          409,
        );
      }

      // safe to delete assignment
      await prisma.assignment.delete({ where: { id: assignmentId } });
    }

    const now = new Date();
    const run = await prisma.assignmentScheduleRun.upsert({
      where: { scheduleId_runDate: { scheduleId, runDate } },
      create: {
        scheduleId,
        runDate,
        isSkipped: true,
        skippedAt: now,
        skipReason: reason,
        assignmentId: null,
      },
      update: {
        isSkipped: true,
        skippedAt: now,
        skipReason: reason,
        assignmentId: null,
      },
      select: { id: true, scheduleId: true, runDate: true, isSkipped: true, skippedAt: true },
    });

    return jsonResponse({ scheduleRun: run }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
