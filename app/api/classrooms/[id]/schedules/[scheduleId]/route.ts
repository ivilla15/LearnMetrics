import { updateClassroomScheduleById, deleteClassroomScheduleById, requireTeacher } from '@/core';
import { classroomIdParamSchema, upsertScheduleSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils/http';
import { handleApiError, readJson, RouteParams } from '@/app';

async function getTeacherClassroomAndScheduleId(params: RouteParams['params']) {
  const auth = await requireTeacher();
  if (!auth.ok) return { ok: false as const, response: errorResponse(auth.error, auth.status) };

  const { id, scheduleId } = await params;

  const { id: classroomId } = classroomIdParamSchema.parse({ id });
  const scheduleIdNum = Number(scheduleId);

  if (!Number.isFinite(scheduleIdNum)) {
    return { ok: false as const, response: errorResponse('Invalid schedule id', 400) };
  }

  return { ok: true as const, teacher: auth.teacher, classroomId, scheduleIdNum };
}

// PATCH: update a specific schedule
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const ctx = await getTeacherClassroomAndScheduleId(params);
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

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const ctx = await getTeacherClassroomAndScheduleId(params);
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
