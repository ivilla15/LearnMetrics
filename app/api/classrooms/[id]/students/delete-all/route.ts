import { deleteAllClassroomStudents, requireTeacher } from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { errorResponse, jsonResponse } from '@/utils';
import { handleApiError, readJson, RouteContext } from '@/app';
import { z } from 'zod';

const deleteAllSchema = z.object({
  deleteAssignments: z.boolean().optional().default(false),
  deleteSchedules: z.boolean().optional().default(false),
});

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const body = await readJson(request);
    const { deleteAssignments, deleteSchedules } = deleteAllSchema.parse(body);

    await deleteAllClassroomStudents({
      teacherId: auth.teacher.id,
      classroomId,
      deleteAssignments,
      deleteSchedules,
    });

    return jsonResponse({ ok: true }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
