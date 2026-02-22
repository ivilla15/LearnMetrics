import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { prisma } from '@/data/prisma';
import { generateSetupCode, hashSetupCode } from '@/core';
import { expiresAtFromNow } from '@/utils';

export async function findStudentById(studentId: number) {
  return prisma.student.findUnique({ where: { id: studentId } });
}

export async function findStudentByIdInClassroom(classroomId: number, studentId: number) {
  return prisma.student.findFirst({
    where: { id: studentId, classroomId },
    select: {
      id: true,
      name: true,
      username: true,
      mustSetPassword: true,
      classroomId: true,
    },
  });
}

export async function findStudentsWithLatestAttempt(classroomId: number, primaryOperation: string) {
  const students = await prisma.student.findMany({
    where: { classroomId },
    select: {
      id: true,
      name: true,
      username: true,
      mustSetPassword: true,
      progress: { select: { operation: true, level: true } },
      Attempt: {
        orderBy: [{ completedAt: 'desc' }, { startedAt: 'desc' }],
        take: 1,
        select: {
          id: true,
          assignmentId: true,
          score: true,
          total: true,
          completedAt: true,
          startedAt: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return students.map((s) => {
    const row = s.progress.find((p) => p.operation === primaryOperation);
    const level = row?.level ?? 1;

    const latest = s.Attempt[0] ?? null;
    const ts = latest ? (latest.completedAt ?? latest.startedAt).toISOString() : null;

    return {
      id: s.id,
      name: s.name,
      username: s.username,
      mustSetPassword: s.mustSetPassword,
      level,
      lastAttempt: latest
        ? {
            id: latest.id,
            assignmentId: latest.assignmentId,
            score: latest.score,
            total: latest.total,
            completedAt: ts!,
          }
        : null,
    };
  });
}

export async function createManyForClassroom(
  classroomId: number,
  students: Array<{ firstName: string; lastName: string; username: string }>,
): Promise<{
  created: Array<{
    id: number;
    name: string;
    username: string;
    setupCode: string;
    setupCodeExpiresAt: Date;
  }>;
}> {
  if (!students.length) return { created: [] };

  const created: Array<{
    id: number;
    name: string;
    username: string;
    setupCode: string;
    setupCodeExpiresAt: Date;
  }> = [];

  const setupExpiresAt = expiresAtFromNow(7);

  for (const s of students) {
    const name = `${s.firstName} ${s.lastName}`.trim();
    const setupCode = generateSetupCode();
    const setupCodeHash = hashSetupCode(setupCode);

    const placeholderPasswordHash = await bcrypt.hash(
      crypto.randomBytes(24).toString('base64url'),
      10,
    );

    try {
      const row = await prisma.student.create({
        data: {
          classroomId,
          name,
          username: s.username,
          passwordHash: placeholderPasswordHash,
          mustSetPassword: true,
          setupCodeHash,
          setupCodeExpiresAt: setupExpiresAt,
        },
        select: { id: true, name: true, username: true, setupCodeExpiresAt: true },
      });

      created.push({
        id: row.id,
        name: row.name,
        username: row.username,
        setupCode,
        setupCodeExpiresAt: row.setupCodeExpiresAt ?? setupExpiresAt,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') continue;
      throw err;
    }
  }

  return { created };
}

export async function updateById(id: number, data: { name?: string; username?: string }) {
  return prisma.student.update({ where: { id }, data });
}

export async function deleteById(id: number) {
  return prisma.student.delete({ where: { id } });
}

export async function deleteStudentsByClassroomId(classroomId: number) {
  return prisma.student.deleteMany({ where: { classroomId } });
}
