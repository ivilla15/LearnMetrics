import { getLatestAssignmentForClassroom } from '@/core/assignments/service';
import { requireTeacher } from '@/core/auth/requireTeacher';
import { jsonResponse, errorResponse } from '@/utils/http';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import * as ClassroomsRepo from '@/data/classrooms.repo';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
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
}
