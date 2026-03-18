import { requireTeacher, deleteAllClassroomStudents } from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { deleteAllStudentsSchema } from '@/validation/teacher/bulk-students';

import { errorResponse, jsonResponse } from '@/utils/http';
import { handleApiError, readJson, type ClassroomRouteContext } from '@/app';

export async function POST(request: Request, { params }: ClassroomRouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const body = await readJson(request);
    const parsed = deleteAllStudentsSchema.parse(body);

    await deleteAllClassroomStudents({
      teacherId: auth.teacher.id,
      classroomId,
      deleteAssignments: parsed.deleteAssignments,
      deleteSchedules: parsed.deleteSchedules,
    });

    return jsonResponse({ ok: true } as const, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
