import { prisma } from '@/data/prisma';
import {
  requireTeacher,
  generateSetupCode,
  hashSetupCode,
  expiresAtFromNowHours,
  SETUP_CODE_TTL_HOURS,
} from '@/core';
import { errorResponse, jsonResponse, parseId } from '@/utils';
import { handleApiError, type ClassroomStudentRouteContext } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';

export async function POST(_req: Request, { params }: ClassroomStudentRouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId: rawStudentId } = await params;

    const classroomId = parseId(id);
    const studentId = parseId(rawStudentId);

    if (!classroomId) return errorResponse('Invalid classroom id', 400);
    if (!studentId) return errorResponse('Invalid student id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const student = await prisma.student.findFirst({
      where: { id: studentId, classroomId },
      select: { id: true, username: true, name: true },
    });
    if (!student) return errorResponse('Student not found', 404);

    const setupCode = generateSetupCode();
    const setupCodeHash = hashSetupCode(setupCode);
    const expiresAt = expiresAtFromNowHours(SETUP_CODE_TTL_HOURS);

    await prisma.student.update({
      where: { id: student.id },
      data: {
        setupCodeHash,
        setupCodeExpiresAt: expiresAt,
        mustSetPassword: true,
      },
    });

    return jsonResponse(
      {
        setupCode: {
          studentId: student.id,
          username: student.username,
          setupCode,
          expiresAt: expiresAt.toISOString(),
          name: student.name,
        },
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
