import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import {
  classroomIdParamSchema,
  studentIdParamSchema,
  upsertStudentProgressSchema,
} from '@/validation';
import { jsonResponse, errorResponse } from '@/utils/http';
import { handleApiError, readJson, type RouteContext } from '@/app';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';

async function ensureStudentProgress(studentId: number) {
  const existing = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { domain: true },
  });

  const have = new Set(existing.map((r) => r.domain));
  const missing = (DOMAIN_CODES as readonly DomainCode[]).filter((d) => !have.has(d));

  if (missing.length > 0) {
    await prisma.studentProgress.createMany({
      data: missing.map((domain) => ({ studentId, domain, level: 1 })),
      skipDuplicates: true,
    });
  }

  return prisma.studentProgress.findMany({
    where: { studentId },
    select: { domain: true, level: true },
    orderBy: { domain: 'asc' },
  });
}

// RouteContext params for /classrooms/[id]/students/[studentId]/progress
type Params = { id: string; studentId: string };

export async function GET(_request: Request, context: RouteContext<Params>) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const { studentId: sid } = studentIdParamSchema.parse({ studentId });

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, teacherId: true },
    });
    if (!classroom) return errorResponse('Classroom not found', 404);
    if (classroom.teacherId !== auth.teacher.id) return errorResponse('Not allowed', 403);

    const student = await prisma.student.findUnique({
      where: { id: sid },
      select: { id: true, classroomId: true },
    });
    if (!student || student.classroomId !== classroomId) {
      return errorResponse('Student not found', 404);
    }

    const progress = await ensureStudentProgress(student.id);

    return jsonResponse({ studentId: student.id, progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext<Params>) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const { studentId: sid } = studentIdParamSchema.parse({ studentId });

    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { id: true, teacherId: true },
    });
    if (!classroom) return errorResponse('Classroom not found', 404);
    if (classroom.teacherId !== auth.teacher.id) return errorResponse('Not allowed', 403);

    const student = await prisma.student.findUnique({
      where: { id: sid },
      select: { id: true, classroomId: true },
    });
    if (!student || student.classroomId !== classroomId) {
      return errorResponse('Student not found', 404);
    }

    const body = await readJson(request);
    const input = upsertStudentProgressSchema.parse(body);

    await ensureStudentProgress(student.id);

    await prisma.$transaction(
      input.levels.map((row) =>
        prisma.studentProgress.update({
          where: { studentId_domain: { studentId: student.id, domain: row.domain } },
          data: { level: row.level },
        }),
      ),
    );

    const progress = await prisma.studentProgress.findMany({
      where: { studentId: student.id },
      select: { domain: true, level: true },
      orderBy: { domain: 'asc' },
    });

    return jsonResponse({ studentId: student.id, progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
