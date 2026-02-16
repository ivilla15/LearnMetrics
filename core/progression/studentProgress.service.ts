import { prisma } from '@/data/prisma';
import { NotFoundError, ConflictError } from '@/core';
import { ALL_OPS, type OperationCode, type StudentProgressLite } from '@/types';

async function getPolicyForClassroom(classroomId: number) {
  const policy = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId },
    select: { enabledOperations: true, maxNumber: true },
  });

  const enabledOperations = (policy?.enabledOperations ?? ['MUL']).filter(
    (op): op is OperationCode => op === 'ADD' || op === 'SUB' || op === 'MUL' || op === 'DIV',
  );

  return {
    enabledOperations,
    maxNumber: policy?.maxNumber ?? 12,
  };
}

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
    await prisma.studentProgress.createMany({
      data: missing.map((op) => ({ studentId, operation: op, level: 1 })),
      skipDuplicates: true,
    });
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

  const policy = await getPolicyForClassroom(params.classroomId);
  const rows = await ensureStudentProgress(params.studentId);

  return rows.filter((r) => policy.enabledOperations.includes(r.operation));
}

export async function setTeacherStudentProgressRows(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
  levels: StudentProgressLite[];
}): Promise<StudentProgressLite[]> {
  await assertTeacherOwnsStudent(params);
  await ensureStudentProgress(params.studentId);

  const policy = await getPolicyForClassroom(params.classroomId);

  const updates = params.levels
    .filter((row) => policy.enabledOperations.includes(row.operation))
    .map((row) => ({
      operation: row.operation,
      level: Math.max(1, Math.min(policy.maxNumber, row.level)),
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

  const rows = await prisma.studentProgress.findMany({
    where: { studentId: params.studentId },
    select: { operation: true, level: true },
    orderBy: { operation: 'asc' },
  });

  return rows.filter((r) => policy.enabledOperations.includes(r.operation));
}

export async function getStudentProgressRows(studentId: number): Promise<StudentProgressLite[]> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { classroomId: true },
  });
  if (!student) throw new NotFoundError('Student not found');

  const policy = await getPolicyForClassroom(student.classroomId);
  const rows = await ensureStudentProgress(studentId);

  return rows.filter((r) => policy.enabledOperations.includes(r.operation));
}
