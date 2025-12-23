import { requireTeacher, AuthError } from '@/core/auth';
import { updateClassroomScheduleById, deleteClassroomScheduleById } from '@/core/schedules/service';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { upsertScheduleSchema } from '@/validation/assignmentSchedules.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError, ConflictError } from '@/core/errors';
import { ZodError } from 'zod';

type RouteParams = {
  params: Promise<{ id: string; scheduleId: string }>;
};

function handleError(err: unknown): Response {
  console.error('Schedule route error:', err);

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

  // In dev you *might* temporarily expose the actual message:
  // const msg = err instanceof Error ? err.message : 'Internal server error';
  // return errorResponse(msg, 500);

  return errorResponse('Internal server error', 500);
}

// PATCH: update a specific schedule
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const teacher = await requireTeacher(request);
    const { id, scheduleId } = await params;

    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const scheduleIdNum = Number(scheduleId);

    if (!Number.isFinite(scheduleIdNum)) {
      return errorResponse('Invalid schedule id', 400);
    }

    const body = await request.json();
    const input = upsertScheduleSchema.parse(body);

    const schedule = await updateClassroomScheduleById({
      teacherId: teacher.id,
      classroomId,
      scheduleId: scheduleIdNum,
      input,
    });

    return jsonResponse({ schedule }, 200);
  } catch (err) {
    return handleError(err);
  }
}

// DELETE: delete a specific schedule
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const teacher = await requireTeacher(request);
    const { id, scheduleId } = await params;

    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const scheduleIdNum = Number(scheduleId);

    if (!Number.isFinite(scheduleIdNum)) {
      return errorResponse('Invalid schedule id', 400);
    }

    await deleteClassroomScheduleById({
      teacherId: teacher.id,
      classroomId,
      scheduleId: scheduleIdNum,
    });

    // 204 should not have a body; avoid JSON helper here.
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error('DELETE /classrooms/[id]/schedules/[scheduleId] error', err);
    return handleError(err);
  }
}
