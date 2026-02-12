import { bulkCreateClassroomStudents, requireTeacher } from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { errorResponse, jsonResponse } from '@/utils';
import { handleApiError, readJson, RouteContext } from '@/app';
import { z } from 'zod';

const bulkStudentsSchema = z.object({
  students: z
    .array(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        username: z.string().min(1),
      }),
    )
    .min(1)
    .max(200),
});

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const body = await readJson(request);
    const { students } = bulkStudentsSchema.parse(body);

    const result = await bulkCreateClassroomStudents({
      teacherId: auth.teacher.id,
      classroomId,
      students,
    });

    // returns: { students, setupCodes }
    return jsonResponse(result, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
