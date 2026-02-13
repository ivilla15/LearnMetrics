import { prisma } from '@/data/prisma';
import { NotFoundError, ConflictError } from '@/core';
import { ALL_OPS, type OperationCode, type StudentProgressLite } from '@/types';

async function assertTeacherOwnsStudent(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
}) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: params.classroomId },
    select: { id: true, teacherId: true },
  });
  if (!classroom) throw new NotFoundError('Classroom not found');
  if (classroom.teacherId !== params.teacherId) throw new ConflictError('Not allowed');

  const student = await prisma.student.findUnique({
    where: { id: params.studentId },
    select: { id: true, classroomId: true },
  });
  if (!student || student.classroomId !== params.classroomId) {
    throw new NotFoundError('Student not found');
  }

  return student;
}

export async function ensureStudentProgress(studentId: number): Promise<StudentProgressLite[]> {
  const existing = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { operation: true },
  });

  const have = new Set(existing.map((r) => r.operation as OperationCode));
  const missing = ALL_OPS.filter((op) => !have.has(op));

  if (missing.length > 0) {
    await prisma.$transaction(
      missing.map((op) =>
        prisma.studentProgress.create({
          data: { studentId, operation: op, level: 1 },
        }),
      ),
    );
  }

  return prisma.studentProgress.findMany({
    where: { studentId },
    select: { operation: true, level: true },
    orderBy: { operation: 'asc' },
  });
}

export async function getTeacherStudentProgressRows(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
}): Promise<StudentProgressLite[]> {
  await assertTeacherOwnsStudent(params);
  return ensureStudentProgress(params.studentId);
}

export async function setTeacherStudentProgressRows(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
  levels: StudentProgressLite[];
}): Promise<StudentProgressLite[]> {
  await assertTeacherOwnsStudent(params);
  await ensureStudentProgress(params.studentId);

  await prisma.$transaction(
    params.levels.map((row) =>
      prisma.studentProgress.update({
        where: { studentId_operation: { studentId: params.studentId, operation: row.operation } },
        data: { level: row.level },
      }),
    ),
  );

  return prisma.studentProgress.findMany({
    where: { studentId: params.studentId },
    select: { operation: true, level: true },
    orderBy: { operation: 'asc' },
  });
}

export async function getStudentProgressRows(studentId: number): Promise<StudentProgressLite[]> {
  return ensureStudentProgress(studentId);
}
