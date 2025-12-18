// app/api/classrooms/[id]/schedule/route.ts
import { requireTeacher, AuthError } from '@/core/auth';
import { upsertClassroomSchedule, getClassroomScheduleForTeacher } from '@/core/schedules/service';
import { upsertScheduleSchema } from '@/validation/assignmentSchedules.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError, ConflictError } from '@/core/errors';
import { ZodError } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const teacher = await requireTeacher(request);

    const { id } = await params;
    const classroomId = Number(id);

    if (!Number.isInteger(classroomId) || classroomId <= 0) {
      return errorResponse('Invalid classroom id', 400);
    }

    const schedule = await getClassroomScheduleForTeacher({
      teacherId: teacher.id,
      classroomId,
    });

    return jsonResponse({ schedule }, 200);
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
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

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const teacher = await requireTeacher(request);
    const body = await request.json();

    const input = upsertScheduleSchema.parse(body);

    const { id } = await params;
    const classroomId = Number(id);

    if (!Number.isInteger(classroomId) || classroomId <= 0) {
      return errorResponse('Invalid classroom id', 400);
    }

    const schedule = await upsertClassroomSchedule({
      teacherId: teacher.id,
      classroomId,
      input,
    });

    return jsonResponse({ schedule }, 200);
  } catch (err) {
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
