import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { prisma } from '@/data/prisma';
import { generateSetupCode, hashSetupCode } from '@/core';

import type { StudentRosterRow } from '@/types/roster';
import type { AttemptSummary } from '@/types/attempts';

/* -------------------------------------------------------------------------- */
/* Basic queries                                                               */
/* -------------------------------------------------------------------------- */

export async function findStudentById(studentId: number) {
  return prisma.student.findUnique({
    where: { id: studentId },
  });
}

export async function findStudentByIdInClassroom(classroomId: number, studentId: number) {
  return prisma.student.findFirst({
    where: { id: studentId, classroomId },
    select: {
      id: true,
      name: true,
      username: true,
      level: true,
      mustSetPassword: true,
      classroomId: true,
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Roster with latest attempt                                                  */
/* -------------------------------------------------------------------------- */

export async function findStudentsWithLatestAttempt(
  classroomId: number,
): Promise<StudentRosterRow[]> {
  const students = await prisma.student.findMany({
    where: { classroomId },
    include: {
      Attempt: {
        orderBy: { completedAt: 'desc' },
        take: 1,
        select: {
          id: true,
          assignmentId: true,
          score: true,
          total: true,
          completedAt: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return students.map((s) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    level: s.level,
    mustSetPassword: s.mustSetPassword,
    lastAttempt: s.Attempt.length ? (s.Attempt[0] as AttemptSummary) : null,
  }));
}

/* -------------------------------------------------------------------------- */
/* Bulk create                                                                 */
/* -------------------------------------------------------------------------- */

export type CreateStudentData = {
  firstName: string;
  lastName: string;
  username: string;
  level: number;
};

export type CreatedStudentWithSetupCode = {
  id: number;
  name: string;
  username: string;
  level: number;
  setupCode: string;
  setupCodeExpiresAt: Date;
};

function expiresAtFromNowDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function createManyForClassroom(
  classroomId: number,
  students: CreateStudentData[],
): Promise<{
  created: CreatedStudentWithSetupCode[];
  roster: StudentRosterRow[];
}> {
  if (!students.length) {
    return {
      created: [],
      roster: await findStudentsWithLatestAttempt(classroomId),
    };
  }

  const created: CreatedStudentWithSetupCode[] = [];
  const setupExpiresAt = expiresAtFromNowDays(7);

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
          level: s.level,
          password: placeholderPasswordHash,
          mustSetPassword: true,
          setupCodeHash,
          setupCodeExpiresAt: setupExpiresAt,
        },
        select: {
          id: true,
          name: true,
          username: true,
          level: true,
          setupCodeExpiresAt: true,
        },
      });

      created.push({
        id: row.id,
        name: row.name,
        username: row.username,
        level: row.level,
        setupCode,
        setupCodeExpiresAt: row.setupCodeExpiresAt ?? setupExpiresAt,
      });
    } catch (err) {
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        // duplicate username → skip
        continue;
      }
      throw err;
    }
  }

  const roster = await findStudentsWithLatestAttempt(classroomId);
  return { created, roster };
}

/* -------------------------------------------------------------------------- */
/* Mutations                                                                   */
/* -------------------------------------------------------------------------- */

export async function updateById(
  id: number,
  data: { name?: string; username?: string; level?: number },
) {
  return prisma.student.update({
    where: { id },
    data,
  });
}

export async function deleteById(id: number) {
  return prisma.student.delete({
    where: { id },
  });
}

export async function deleteStudentsByClassroomId(classroomId: number) {
  return prisma.student.deleteMany({
    where: { classroomId },
  });
}
