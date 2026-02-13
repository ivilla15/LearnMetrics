import {
  requireTeacher,
  getTeacherStudentProgressRows,
  setTeacherStudentProgressRows,
} from '@/core';
import {
  classroomIdParamSchema,
  studentIdParamSchema,
  upsertStudentProgressSchema,
} from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, RouteContext } from '@/app';

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const { studentId: sid } = studentIdParamSchema.parse({ studentId });

    const progress = await getTeacherStudentProgressRows({
      teacherId: auth.teacher.id,
      classroomId,
      studentId: sid,
    });

    return jsonResponse({ studentId: sid, progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const { studentId: sid } = studentIdParamSchema.parse({ studentId });

    const body = await readJson(request);
    const input = upsertStudentProgressSchema.parse(body);

    const progress = await setTeacherStudentProgressRows({
      teacherId: auth.teacher.id,
      classroomId,
      studentId: sid,
      levels: input.levels,
    });

    return jsonResponse({ studentId: sid, progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
