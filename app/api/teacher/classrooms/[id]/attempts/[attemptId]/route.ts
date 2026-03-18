import { requireTeacher, getTeacherAttemptDetail } from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { errorResponse, jsonResponse, parseId } from '@/utils';
import { handleApiError } from '@/app';

type RouteCtx = { params: Promise<{ id: string; attemptId: string }> };

export async function GET(_req: Request, { params }: RouteCtx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, attemptId } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const aid = parseId(attemptId);
    if (!aid) return errorResponse('Invalid attempt id', 400);

    const dto = await getTeacherAttemptDetail({
      teacherId: auth.teacher.id,
      classroomId,
      attemptId: aid,
    });

    return jsonResponse(dto, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
