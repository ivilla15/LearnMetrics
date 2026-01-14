import { requireTeacher } from '@/core';
import * as ProgressRepo from '@/data/teacherProgress.repo';
import { classroomIdParamSchema } from '@/validation';
import { errorResponse, jsonResponse } from '@/utils';
import { handleApiError, type RouteContext } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';
import { getTeacherClassroomProgress } from '@/core/teacher/Progress';

function clampInt(n: number, min: number, max: number) {
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const url = new URL(req.url);

    const rawDays = url.searchParams.get('days') ?? '30';
    const daysParsed = Number(rawDays);
    const days = Number.isFinite(daysParsed) ? clampInt(daysParsed, 1, 365) : 30;

    // optional drilldown mode
    const questionIdRaw = url.searchParams.get('questionId');

    if (questionIdRaw !== null) {
      const questionIdNum = Number(questionIdRaw);
      if (!Number.isFinite(questionIdNum) || questionIdNum <= 0) {
        return errorResponse('Invalid questionId', 400);
      }

      await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

      const endAt = new Date();
      const startAt = new Date(endAt.getTime() - days * 24 * 60 * 60 * 1000);

      const detail = await ProgressRepo.getMissedFactStudentBreakdownInRange({
        classroomId,
        startAt,
        endAt,
        questionId: questionIdNum,
      });

      return jsonResponse(
        {
          questionId: questionIdNum,
          days,
          totalIncorrect: detail.totalIncorrect,
          totalAttempts: detail.totalCount,
          students: detail.students.map((s) => ({
            studentId: s.studentId,
            name: s.name,
            username: s.username,
            incorrectCount: s.incorrectCount,
            totalCount: s.totalCount,
          })),
        },
        200,
      );
    }

    const dto = await getTeacherClassroomProgress({
      teacherId: auth.teacher.id,
      classroomId,
      days,
    });

    return jsonResponse(dto, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
