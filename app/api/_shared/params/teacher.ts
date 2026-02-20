import { requireTeacher } from '@/core';
import { classroomIdParamSchema } from '@/validation';
import { errorResponse } from '@/utils/http';
import type { RouteContext } from '@/app/api/_shared/route-types';

function parsePositiveId(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export async function getTeacherClassroomParams(params: RouteContext<{ id: string }>['params']) {
  const auth = await requireTeacher();
  if (!auth.ok) return { ok: false as const, response: errorResponse(auth.error, auth.status) };

  const { id } = await params;
  const parsed = classroomIdParamSchema.parse({ id });

  return { ok: true as const, teacher: auth.teacher, classroomId: parsed.id };
}

export async function getTeacherClassroomStudentParams(
  params: RouteContext<{ id: string; studentId: string }>['params'],
) {
  const base = await getTeacherClassroomParams(
    Promise.resolve(await params).then((p) => ({ id: p.id })),
  );

  if (!base.ok) return base;

  const { studentId } = await params;
  const studentIdNum = parsePositiveId(studentId);
  if (!studentIdNum) {
    return { ok: false as const, response: errorResponse('Invalid student id', 400) };
  }

  return { ok: true as const, teacher: base.teacher, classroomId: base.classroomId, studentIdNum };
}

export async function getTeacherClassroomScheduleParams(
  params: RouteContext<{ id: string; scheduleId: string }>['params'],
) {
  const base = await getTeacherClassroomParams(
    Promise.resolve(await params).then((p) => ({ id: p.id })),
  );

  if (!base.ok) return base;

  const { scheduleId } = await params;
  const scheduleIdNum = parsePositiveId(scheduleId);
  if (!scheduleIdNum) {
    return { ok: false as const, response: errorResponse('Invalid schedule id', 400) };
  }

  return {
    ok: true as const,
    teacher: base.teacher,
    classroomId: base.classroomId,
    scheduleIdNum,
  };
}

export async function getTeacherClassroomAssignmentParams(
  params: RouteContext<{ id: string; assignmentId: string }>['params'],
) {
  const base = await getTeacherClassroomParams(
    Promise.resolve(await params).then((p) => ({ id: p.id })),
  );

  if (!base.ok) return base;

  const { assignmentId } = await params;
  const assignmentIdNum = parsePositiveId(assignmentId);
  if (!assignmentIdNum) {
    return { ok: false as const, response: errorResponse('Invalid assignment id', 400) };
  }

  return {
    ok: true as const,
    teacher: base.teacher,
    classroomId: base.classroomId,
    assignmentIdNum,
  };
}
