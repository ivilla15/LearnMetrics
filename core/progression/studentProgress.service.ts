import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import { OPERATION_CODES, type OperationCode } from '@/types/enums';
import type { StudentProgressLiteDTO } from '@/types/api/progression';
import { getProgressionSnapshot } from './policySnapshot.service';
import { assertTeacherOwnsStudent } from '@/core/students/ownership';

export async function ensureStudentProgress(studentId: number): Promise<StudentProgressLiteDTO[]> {
  const existing = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { operation: true },
  });

  const have = new Set(existing.map((r) => r.operation as OperationCode));
  const missing = OPERATION_CODES.filter((op) => !have.has(op));

  if (missing.length > 0) {
    await prisma.studentProgress.createMany({
      data: missing.map((op) => ({ studentId, operation: op, level: 1 })),
      skipDuplicates: true,
    });
  }

  return prisma.studentProgress.findMany({
    where: { studentId },
    select: { operation: true, level: true },
    orderBy: { operation: 'asc' },
  }) as unknown as StudentProgressLiteDTO[];
}

export async function getTeacherStudentProgressRows(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
}): Promise<StudentProgressLiteDTO[]> {
  await assertTeacherOwnsStudent(params);

  const snapshot = await getProgressionSnapshot(params.classroomId);
  const rows = await ensureStudentProgress(params.studentId);

  return rows.filter((r) => snapshot.enabledOperations.includes(r.operation));
}

export async function setTeacherStudentProgressRows(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
  levels: StudentProgressLiteDTO[];
}): Promise<StudentProgressLiteDTO[]> {
  await assertTeacherOwnsStudent(params);
  await ensureStudentProgress(params.studentId);

  const snapshot = await getProgressionSnapshot(params.classroomId);

  const updates = params.levels
    .filter((row) => snapshot.enabledOperations.includes(row.operation))
    .map((row) => ({
      operation: row.operation,
      level: Math.max(1, Math.min(snapshot.maxNumber, Math.trunc(row.level))),
    }));

  if (updates.length > 0) {
    await prisma.$transaction(
      updates.map((row) =>
        prisma.studentProgress.update({
          where: { studentId_operation: { studentId: params.studentId, operation: row.operation } },
          data: { level: row.level },
        }),
      ),
    );
  }

  const rows = (await prisma.studentProgress.findMany({
    where: { studentId: params.studentId },
    select: { operation: true, level: true },
    orderBy: { operation: 'asc' },
  })) as unknown as StudentProgressLiteDTO[];

  return rows.filter((r) => snapshot.enabledOperations.includes(r.operation));
}

export async function getStudentProgressRows(studentId: number): Promise<StudentProgressLiteDTO[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classroomId: true },
  });
  if (!student) throw new NotFoundError('Student not found');

  const snapshot = await getProgressionSnapshot(student.classroomId);
  const rows = await ensureStudentProgress(studentId);

  return rows.filter((r) => snapshot.enabledOperations.includes(r.operation));
}
