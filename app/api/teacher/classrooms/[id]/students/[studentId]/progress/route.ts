import {
  requireTeacher,
  getTeacherStudentProgressRows,
  setTeacherStudentProgressRows,
  getProgressionSnapshot,
} from '@/core';
import {
  classroomIdParamSchema,
  studentIdParamSchema,
  upsertStudentProgressSchema,
} from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson } from '@/app';

type StudentProgressRouteContext = {
  params: Promise<{ id: string; studentId: string }>;
};

export async function GET(_request: Request, context: StudentProgressRouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const { studentId: sid } = studentIdParamSchema.parse({ studentId });

    const policy = await getProgressionSnapshot(classroomId);

    const progress = await getTeacherStudentProgressRows({
      teacherId: auth.teacher.id,
      classroomId,
      studentId: sid,
    });

    return jsonResponse({ studentId: sid, policy, progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function PUT(request: Request, context: StudentProgressRouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const { studentId: sid } = studentIdParamSchema.parse({ studentId });

    const body = await readJson(request);
    const input = upsertStudentProgressSchema.parse(body);

    const policy = await getProgressionSnapshot(classroomId);

    const progress = await setTeacherStudentProgressRows({
      teacherId: auth.teacher.id,
      classroomId,
      studentId: sid,
      levels: input.levels,
    });

    return jsonResponse({ studentId: sid, policy, progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
