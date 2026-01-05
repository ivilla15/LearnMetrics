import { createScheduledAssignment } from '@/core/assignments/service';
import { errorResponse, jsonResponse } from '@/utils/http';
import { createScheduleRequestSchema } from '@/validation/assignments.schema';
import { ZodError } from 'zod';
import { requireTeacher } from '@/core/auth/requireTeacher';
import { NotFoundError } from '@/core/errors';
import * as ClassroomsRepo from '@/data/classrooms.repo';

export async function POST(request: Request) {
  try {
    // 0) Auth
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    // 1) Parse request body
    const raw = await request.json();

    // 2) Validate
    const input = createScheduleRequestSchema.parse(raw);

    // 3) Ownership check
    const classroom = await ClassroomsRepo.findClassroomById(input.classroomId);
    if (!classroom) return errorResponse('Classroom not found', 404);

    if (classroom.teacherId !== auth.teacher.id) {
      return errorResponse('You are not allowed to create assignments for this classroom', 403);
    }

    // 4) Business logic (manual assignment creation)
    const result = await createScheduledAssignment({
      ...input,
      assignmentMode: 'MANUAL',
      // optional hard safety:
      // numQuestions: Math.min(input.numQuestions ?? 12, 12),
    });

    return jsonResponse(result, 200);
  } catch (err) {
    if (err instanceof ZodError) return errorResponse('Invalid request body', 400);
    if (err instanceof NotFoundError) return errorResponse(err.message, 404);
    return errorResponse('Internal server error', 500);
  }
}
