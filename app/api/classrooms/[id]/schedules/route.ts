import { requireTeacher } from '@/core/auth/requireTeacher';
import { getClassroomSchedulesForTeacher } from '@/core/schedules/service';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError, ConflictError } from '@/core/errors';
import { ZodError } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);
    const teacher = auth.teacher;

    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const schedules = await getClassroomSchedulesForTeacher({
      teacherId: teacher.id,
      classroomId,
    });

    return jsonResponse({ schedules }, 200);
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return errorResponse('Invalid request body', 400);
    }
    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }
    if (err instanceof ConflictError) {
      return errorResponse(err.message, 409);
    }
    return errorResponse('Internal server error', 500);
  }
}
