import { requireTeacher, getOrCreateClassroomPolicy, updateClassroomPolicy } from '@/core';
import { classroomIdParamSchema, upsertProgressionPolicySchema } from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, RouteContext } from '@/app';

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const policy = await getOrCreateClassroomPolicy({
      teacherId: auth.teacher.id,
      classroomId,
    });

    return jsonResponse({ policy }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const body = await readJson(request);
    const input = upsertProgressionPolicySchema.parse(body);

    const policy = await updateClassroomPolicy({
      teacherId: auth.teacher.id,
      classroomId,
      input,
    });

    return jsonResponse({ policy }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
