import { requireTeacher, getOrCreateClassroomPolicy, updateClassroomPolicy } from '@/core';
import { classroomIdParamSchema, upsertProgressionPolicySchema } from '@/validation';
import { handleApiError, readJson, RouteContext } from '@/app/api/_shared/';
import { jsonResponse, errorResponse } from '@/utils/http';

type Ctx = RouteContext<{ id: string }>;

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const policy = await getOrCreateClassroomPolicy({
      teacherId: auth.teacher.id,
      classroomId,
    });

    return jsonResponse({ policy }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
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
    return handleApiError(err);
  }
}
