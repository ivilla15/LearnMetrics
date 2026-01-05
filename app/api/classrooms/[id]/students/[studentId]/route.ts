import { requireTeacher } from '@/core/auth/requireTeacher';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError, ConflictError } from '@/core/errors';
import { ZodError, z } from 'zod';
import {
  updateClassroomStudentById,
  deleteClassroomStudentById,
} from '@/app/api/student/_lib/roster.service';

type RouteParams = {
  params: Promise<{ id: string; studentId: string }>;
};

const updateStudentSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  level: z.number().int().min(1),
});

function handleError(err: unknown): Response {
  if (err instanceof ZodError) return errorResponse('Invalid request body', 400);
  if (err instanceof NotFoundError) return errorResponse(err.message, 404);
  if (err instanceof ConflictError) return errorResponse(err.message, 409);
  console.error('student route error', err);
  return errorResponse('Internal server error', 500);
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);
    const teacher = auth.teacher;
    const { id, studentId } = await params;

    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const studentIdNum = Number(studentId);
    if (!Number.isFinite(studentIdNum)) {
      return errorResponse('Invalid student id', 400);
    }

    const body = await request.json();
    const input = updateStudentSchema.parse(body);

    const student = await updateClassroomStudentById({
      teacherId: teacher.id,
      classroomId,
      studentId: studentIdNum,
      input,
    });

    return jsonResponse({ student }, 200);
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);
    const teacher = auth.teacher;
    const { id, studentId } = await params;

    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const studentIdNum = Number(studentId);
    if (!Number.isFinite(studentIdNum)) {
      return errorResponse('Invalid student id', 400);
    }

    await deleteClassroomStudentById({
      teacherId: teacher.id,
      classroomId,
      studentId: studentIdNum,
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
