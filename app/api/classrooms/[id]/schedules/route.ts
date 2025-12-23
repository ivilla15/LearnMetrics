import { requireTeacher, AuthError } from '@/core/auth';
import { getClassroomSchedulesForTeacher } from '@/core/schedules/service';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError, ConflictError } from '@/core/errors';
import { ZodError } from 'zod';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const teacher = await requireTeacher(request);

    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const schedules = await getClassroomSchedulesForTeacher({
      teacherId: teacher.id,
      classroomId,
    });

    return jsonResponse({ schedules }, 200);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
    }
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
