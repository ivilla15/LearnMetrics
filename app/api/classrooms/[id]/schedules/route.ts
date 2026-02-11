import {
  requireTeacher,
  getClassroomSchedulesForTeacher,
  createAdditionalClassroomSchedule,
} from '@/core';
import { classroomIdParamSchema, upsertScheduleSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, RouteContext } from '@/app';
import { prisma } from '@/data/prisma';
import { isTrialLocked } from '@/core/entitlements/isTrialLocked';

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const schedules = await getClassroomSchedulesForTeacher({
      teacherId: auth.teacher.id,
      classroomId,
    });

    return jsonResponse({ schedules }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    // Entitlement gate (Trial = 1 schedule total per teacher)
    const ent = await prisma.teacherEntitlement.findUnique({
      where: { teacherId: auth.teacher.id },
      select: { plan: true, status: true, trialEndsAt: true },
    });

    if (isTrialLocked(ent)) {
      return errorResponse('Your trial has ended. Upgrade to create new schedules.', 403);
    }

    if (ent?.plan === 'TRIAL') {
      const scheduleCount = await prisma.assignmentSchedule.count({
        where: { Classroom: { teacherId: auth.teacher.id } },
      });

      if (scheduleCount >= 1) {
        return errorResponse('Trial is limited to 1 schedule total. Upgrade to add more.', 403);
      }
    }

    const body = await readJson(request);
    const input = upsertScheduleSchema.parse(body);

    const schedule = await createAdditionalClassroomSchedule({
      teacherId: auth.teacher.id,
      classroomId,
      input,
    });

    return jsonResponse({ schedule }, 201);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
