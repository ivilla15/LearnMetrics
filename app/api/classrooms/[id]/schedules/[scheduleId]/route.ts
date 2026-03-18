import { handleApiError } from '@/app/api/_shared/handle-error';
import { readJson, type RouteContext } from '@/app';

import { getTeacherClassroomScheduleParams } from '@/app/api/_shared/params/teacher';
import { jsonResponse } from '@/utils/http';

import { updateClassroomScheduleById, deleteClassroomScheduleById } from '@/core';

import { upsertScheduleSchema } from '@/validation/assignmentSchedules.schema';

export async function PATCH(
  request: Request,
  { params }: RouteContext<{ id: string; scheduleId: string }>,
) {
  try {
    const ctx = await getTeacherClassroomScheduleParams(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const input = upsertScheduleSchema.parse(body);

    const schedule = await updateClassroomScheduleById({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      scheduleId: ctx.scheduleIdNum,
      input,
    });

    return jsonResponse({ schedule }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext<{ id: string; scheduleId: string }>,
) {
  try {
    const ctx = await getTeacherClassroomScheduleParams(params);
    if (!ctx.ok) return ctx.response;

    await deleteClassroomScheduleById({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      scheduleId: ctx.scheduleIdNum,
    });

    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
