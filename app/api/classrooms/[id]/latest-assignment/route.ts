import { getLatestAssignmentForClassroom, requireTeacher } from '@/core';
import { jsonResponse, errorResponse } from '@/utils';
import { classroomIdParamSchema } from '@/validation';
import * as ClassroomsRepo from '@/data';
import { RouteContext, handleApiError } from '@/app';

export async function GET(_request: Request, context: RouteContext) {
  try {
    // 0) Auth
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    // 1) Params
    const { id } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    // 2) Ownership check
    const classroom = await ClassroomsRepo.findClassroomById(classroomId);
    if (!classroom) return errorResponse('Classroom not found', 404);

    if (classroom.teacherId !== auth.teacher.id) {
      return errorResponse('Not allowed', 403);
    }

    // 3) Data
    const latest = await getLatestAssignmentForClassroom(classroomId);
    return jsonResponse({ latest }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
