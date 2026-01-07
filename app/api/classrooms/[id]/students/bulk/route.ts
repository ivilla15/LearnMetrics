// app/api/classrooms/[id]/students/bulk/route.ts
import { requireTeacher } from '@/core/auth/requireTeacher';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { NotFoundError, ConflictError } from '@/core/errors';
import { ZodError, z } from 'zod';
import { bulkCreateClassroomStudents } from '@/core/students/service';

type RouteParams = {
  params: Promise<{ id: string }>;
};

const bulkStudentsSchema = z.object({
  students: z
    .array(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        username: z.string().min(1),
        level: z.number().int().min(1).max(12),
      }),
    )
    .min(1)
    .max(200),
});

function handleError(err: unknown): Response {
  if (err instanceof ZodError) return errorResponse('Invalid request body', 400);
  if (err instanceof NotFoundError) return errorResponse(err.message, 404);
  if (err instanceof ConflictError) return errorResponse(err.message, 409);
  console.error('bulk students error', err);
  return errorResponse('Internal server error', 500);
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const body = await request.json();
    const { students } = bulkStudentsSchema.parse(body);

    const result = await bulkCreateClassroomStudents({
      teacherId: auth.teacher.id,
      classroomId,
      students,
    });

    // returns: { students, setupCodes }
    return jsonResponse(result, 201);
  } catch (err) {
    return handleError(err);
  }
}
