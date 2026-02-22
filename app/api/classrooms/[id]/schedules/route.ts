import { prisma } from '@/data/prisma';

import { handleApiError } from '@/app/api/_shared/handle-error';
import { readJson, type RouteContext } from '@/app';

import { getTeacherClassroomParams } from '@/app/api/_shared/params/teacher';
import { jsonResponse, errorResponse } from '@/utils/http';

import {
  requireTeacher,
  getClassroomSchedulesForTeacher,
  createAdditionalClassroomSchedule,
} from '@/core';

import { upsertScheduleSchema } from '@/validation/assignmentSchedules.schema';
import { isTrialLocked } from '@/core/entitlements/isTrialLocked';

export async function GET(_request: Request, { params }: RouteContext<{ id: string }>) {
  try {
    const ctx = await getTeacherClassroomParams(params);
    if (!ctx.ok) return ctx.response;

    const schedules = await getClassroomSchedulesForTeacher({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
    });

    return jsonResponse({ schedules }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function POST(request: Request, { params }: RouteContext<{ id: string }>) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const ctx = await getTeacherClassroomParams(params);
    if (!ctx.ok) return ctx.response;

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
      classroomId: ctx.classroomId,
      input,
    });

    return jsonResponse({ schedule }, 201);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
