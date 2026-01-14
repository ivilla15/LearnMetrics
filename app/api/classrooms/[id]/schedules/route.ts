import { requireTeacher, getClassroomSchedulesForTeacher } from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, RouteContext } from '@/app';

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
