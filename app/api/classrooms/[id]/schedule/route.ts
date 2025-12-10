// app/api/classrooms/[id]/schedule/route.ts

import { upsertClassroomSchedule, getClassroomScheduleForTeacher } from '@/core/schedules/service';
import { upsertScheduleSchema } from '@/validation/assignmentSchedules.schema';
import { requireTeacher, AuthError } from '@/core/auth';
import { jsonResponse, errorResponse } from '@/utils/http';
import { ZodError } from 'zod';
import { NotFoundError, ConflictError } from '@/core/errors';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    // 0) Auth: must be a teacher
    const teacher = await requireTeacher(request);

    // 1) Get classroomId from URL
    const { id } = await context.params;
    const classroomId = Number(id);

    if (!Number.isInteger(classroomId) || classroomId <= 0) {
      return errorResponse('Invalid classroom id', 400);
    }

    // 2) Parse + validate body
    const raw = await request.json();
    const input = upsertScheduleSchema.parse(raw);

    // 3) Business logic: create or update schedule
    const result = await upsertClassroomSchedule({
      teacherId: teacher.id,
      classroomId,
      input,
    });

    // 4) Success
    return jsonResponse(result, 200);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse({ error: 'Invalid request body', issues: err.issues }, 400);
    }

    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
    }

    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }

    if (err instanceof ConflictError) {
      // teacher doesn’t own this classroom, etc.
      return errorResponse(err.message, 403);
    }

    return errorResponse('Internal server error', 500);
  }
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const teacher = await requireTeacher(request);

    const { id } = await context.params;
    const classroomId = Number(id);

    if (!Number.isInteger(classroomId) || classroomId <= 0) {
      return errorResponse('Invalid classroom id', 400);
    }

    const schedule = await getClassroomScheduleForTeacher({
      teacherId: teacher.id,
      classroomId,
    });

    // If no schedule yet, return null instead of 404
    return jsonResponse({ schedule }, 200);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
    }

    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }

    if (err instanceof ConflictError) {
      return errorResponse(err.message, 403);
    }

    return errorResponse('Internal server error', 500);
  }
}
