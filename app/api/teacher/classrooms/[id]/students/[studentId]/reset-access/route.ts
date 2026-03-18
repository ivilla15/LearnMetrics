import { prisma } from '@/data/prisma';
import {
  requireTeacher,
  generateSetupCode,
  hashSetupCode,
  expiresAtFromNowHours,
  SETUP_CODE_TTL_HOURS,
} from '@/core';
import {
  handleApiError,
  getTeacherClassroomStudentParams,
  type RouteContext,
} from '@/app/api/_shared';
import { errorResponse, jsonResponse } from '@/utils';
import type { SetupCodeCardDTO } from '@/types';

type Ctx = RouteContext<{ id: string; studentId: string }>;

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const ctx = await getTeacherClassroomStudentParams(params);
    if (!ctx.ok) return ctx.response;

    // Ensure student belongs to classroom (and implicitly teacher via classroom ownership)
    const student = await prisma.student.findFirst({
      where: { id: ctx.studentIdNum, classroomId: ctx.classroomId },
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

    const setupCodeCard: SetupCodeCardDTO = {
      studentId: student.id,
      username: student.username,
      setupCode,
      expiresAt: expiresAt.toISOString(),
      name: student.name,
    };

    return jsonResponse({ setupCode: setupCodeCard }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
