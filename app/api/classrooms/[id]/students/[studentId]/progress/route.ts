import { requireTeacher } from '@/core';
import {
  classroomIdParamSchema,
  studentIdParamSchema,
  upsertStudentProgressSchema,
} from '@/validation';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError, readJson, RouteContext } from '@/app';
import { prisma } from '@/data/prisma';
import { OperationCode, ALL_OPS } from '@/types';


async function ensureStudentProgress(studentId: number) {
  const existing = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { operation: true },
  });

  const have = new Set(existing.map((r) => r.operation as OperationCode));
  const missing = ALL_OPS.filter((op) => !have.has(op));

  if (missing.length === 0) {
    return prisma.studentProgress.findMany({
      where: { studentId },
      select: { operation: true, level: true },
      orderBy: { operation: 'asc' },
    });
  }

  await prisma.$transaction(
    missing.map((op) =>
      prisma.studentProgress.create({
        data: { studentId, operation: op, level: 1 },
      }),
    ),
  );

  return prisma.studentProgress.findMany({
    where: { studentId },
    select: { operation: true, level: true },
    orderBy: { operation: 'asc' },
  });
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const { studentId: sid } = studentIdParamSchema.parse({ studentId });

    // Ownership + student belongs to classroom
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

export async function PUT(request: Request, context: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, studentId } = await context.params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const { studentId: sid } = studentIdParamSchema.parse({ studentId });

    // Ownership + student belongs to classroom
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

    // Ensure rows exist first
    await ensureStudentProgress(student.id);

    // Apply updates (transaction)
    await prisma.$transaction(
      input.levels.map((row) =>
        prisma.studentProgress.update({
          where: { studentId_operation: { studentId: student.id, operation: row.operation } },
          data: { level: row.level },
        }),
      ),
    );

    const progress = await prisma.studentProgress.findMany({
      where: { studentId: student.id },
      select: { operation: true, level: true },
      orderBy: { operation: 'asc' },
    });

    return jsonResponse({ studentId: student.id, progress }, 200);
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}