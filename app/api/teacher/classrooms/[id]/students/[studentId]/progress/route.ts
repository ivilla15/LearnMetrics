import { requireTeacher } from '@/core';
import { jsonError, parseId } from '@/utils';
import { handleApiError } from '@/app';
import { getTeacherStudentProgress } from '@/core/teacher/Progress';

type RouteCtx = { params: Promise<{ id: string; studentId: string }> };

function clampInt(n: number, min: number, max: number) {
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export async function GET(req: Request, { params }: RouteCtx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const { id, studentId } = await params;

    const classroomId = parseId(id);
    if (!classroomId) return jsonError('Invalid classroom id', 400);

    const sid = parseId(studentId);
    if (!sid) return jsonError('Invalid student id', 400);

    const url = new URL(req.url);
    const rawDays = url.searchParams.get('days') ?? '30';
    const daysParsed = Number(rawDays);
    const days = Number.isFinite(daysParsed) ? clampInt(daysParsed, 1, 365) : 30;

    const dto = await getTeacherStudentProgress({
      teacherId: auth.teacher.id,
      classroomId,
      studentId: sid,
      days,
    });

    return new Response(JSON.stringify(dto), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
