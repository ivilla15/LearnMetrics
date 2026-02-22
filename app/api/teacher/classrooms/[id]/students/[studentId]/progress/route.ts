import {
  getProgressionSnapshot,
  getTeacherStudentProgressRows,
  requireTeacher,
  setTeacherStudentProgressRows,
} from '@/core';
import { upsertStudentProgressSchema } from '@/validation';
import {
  handleApiError,
  readJson,
  RouteContext,
  getTeacherClassroomStudentParams,
} from '@/app/api/_shared';
import { jsonResponse, errorResponse } from '@/utils/http';

export async function GET(
  _request: Request,
  { params }: RouteContext<{ id: string; studentId: string }>,
) {
  try {
    const ctx = await getTeacherClassroomStudentParams(params);
    if (!ctx.ok) return ctx.response;

    const policy = await getProgressionSnapshot(ctx.classroomId);

    const progress = await getTeacherStudentProgressRows({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentIdNum,
    });

    return jsonResponse(
      {
        studentId: ctx.studentIdNum,
        policy,
        progress,
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: RouteContext<{ id: string; studentId: string }>,
) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const ctx = await getTeacherClassroomStudentParams(params);
    if (!ctx.ok) return ctx.response;

    const body = await readJson(request);
    const input = upsertStudentProgressSchema.parse(body);

    const policy = await getProgressionSnapshot(ctx.classroomId);

    const progress = await setTeacherStudentProgressRows({
      teacherId: ctx.teacher.id,
      classroomId: ctx.classroomId,
      studentId: ctx.studentIdNum,
      levels: input.levels,
    });

    return jsonResponse(
      {
        studentId: ctx.studentIdNum,
        policy,
        progress,
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
