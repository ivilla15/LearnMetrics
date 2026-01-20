import {
  requireTeacher,
  getClassroomSchedulesForTeacher,
  createAdditionalClassroomSchedule,
} from '@/core';
import { classroomIdParamSchema, upsertScheduleSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, RouteContext } from '@/app';

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
