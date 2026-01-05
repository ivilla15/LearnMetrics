import { requireTeacher } from '@/core/auth/requireTeacher';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError, ConflictError } from '@/core/errors';
import { ZodError, z } from 'zod';
import { deleteAllClassroomStudents } from '@/app/api/student/_lib/roster.service';

type RouteParams = {
  params: Promise<{ id: string }>;
};

const deleteAllSchema = z.object({
  deleteAssignments: z.boolean().optional().default(false),
  deleteSchedules: z.boolean().optional().default(false),
});

function handleError(err: unknown): Response {
  if (err instanceof ZodError) return errorResponse('Invalid request body', 400);
  if (err instanceof NotFoundError) return errorResponse(err.message, 404);
  if (err instanceof ConflictError) return errorResponse(err.message, 409);
  console.error('delete-all students error', err);
  return errorResponse('Internal server error', 500);
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);
    const teacher = auth.teacher;
    const { id } = await params;

    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const body = await request.json();
    const { deleteAssignments, deleteSchedules } = deleteAllSchema.parse(body);

    await deleteAllClassroomStudents({
      teacherId: teacher.id,
      classroomId,
      deleteAssignments,
      deleteSchedules,
    });

    return jsonResponse({ ok: true }, 200);
  } catch (err) {
    return handleError(err);
  }
}
