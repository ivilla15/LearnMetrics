// app/api/assignments/create-friday/route.ts
import { createFridayAssignment } from '@/core/assignments/service';
import { errorResponse, jsonResponse } from '@/utils/http';
import { createFridayRequestSchema } from '@/validation/assignments.schema';
import { ZodError } from 'zod';
import { requireTeacher, AuthError } from '@/core/auth';
import { NotFoundError } from '@/core/errors';
import * as ClassroomsRepo from '@/data/classrooms.repo';

export async function POST(request: Request) {
  try {
    // 0) Auth: require a valid teacher header
    const teacher = await requireTeacher(request);
    // Right now we’re not using `teacher` further,
    // but later we can enforce classroom ownership using teacher.id

    // 1) Parse request body
    const raw = await request.json();

    // 2) Validate shape + coerce types
    const input = createFridayRequestSchema.parse(raw);

    // 2.5) Ownership check: teacher must own the classroom
    const classroom = await ClassroomsRepo.findClassroomById(input.classroomId);

    if (!classroom) {
      return errorResponse('Classroom not found', 404);
    }

    if (classroom.teacherId !== teacher.id) {
      return errorResponse('You are not allowed to create assignments for this classroom', 403);
    }

    // 3) Business logic
    const result = await createFridayAssignment(input);

    // 4) Success
    return jsonResponse(result, 200);
  } catch (err) {
    // Validation error
    if (err instanceof ZodError) {
      return errorResponse('Invalid request body', 400);
    }

    // Auth issues (missing/invalid header)
    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
    }

    // Teacher id in header, but teacher not found in DB
    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }

    // Fallback
    return errorResponse('Internal server error', 500);
  }
}
