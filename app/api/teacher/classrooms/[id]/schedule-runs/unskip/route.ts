// app/api/teacher/classrooms/[id]/schedule-runs/unskip/route.ts
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

    const body = (await readJson(req)) as { scheduleId?: number; runDate?: string };

    const scheduleId = Number(body?.scheduleId);
    const runDateRaw = body?.runDate;

    if (!Number.isFinite(scheduleId) || scheduleId <= 0) {
      return errorResponse('Invalid scheduleId', 400);
    }
    if (!runDateRaw || isNaN(new Date(runDateRaw).getTime())) {
      return errorResponse('Invalid runDate', 400);
    }
    const runDate = new Date(runDateRaw);

    const existing = await prisma.assignmentScheduleRun.findUnique({
      where: { scheduleId_runDate: { scheduleId, runDate } },
      select: { id: true, isSkipped: true },
    });

    if (!existing) {
      return errorResponse('No skip found for that schedule/runDate', 404);
    }

    const updated = await prisma.assignmentScheduleRun.update({
      where: { id: existing.id },
      data: { isSkipped: false, skippedAt: null, skipReason: null },
      select: { id: true, scheduleId: true, runDate: true, isSkipped: true },
    });

    return jsonResponse({ scheduleRun: updated }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
