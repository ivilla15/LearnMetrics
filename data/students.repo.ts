import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { prisma } from '@/data/prisma';
import { generateSetupCode, hashSetupCode } from '@/core';

import type { StudentRosterRow } from '@/types/api/roster';
import type { AttemptSummary } from '@/types/api/attempts';
import type { Prisma } from '@prisma/client';
import type { OperationCode } from '@/types/api/progression';
import { expiresAtFromNow } from '@/utils';

/* -------------------------------------------------------------------------- */
/* Basic queries                                                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Roster with latest attempt                                                  */
/* -------------------------------------------------------------------------- */

type LatestAttemptRow = Prisma.AttemptGetPayload<{
  select: {
    id: true;
    assignmentId: true;
    score: true;
    total: true;
    completedAt: true;
    startedAt: true;
  };
}>;

type StudentWithLatestAttemptRow = Prisma.StudentGetPayload<{
  select: {
    id: true;
    name: true;
    username: true;
    mustSetPassword: true;
    progress: { select: { operation: true; level: true } };
    Attempt: {
      take: 1;
      orderBy: [{ completedAt: 'desc' }, { startedAt: 'desc' }];
      select: {
        id: true;
        assignmentId: true;
        score: true;
        total: true;
        completedAt: true;
        startedAt: true;
      };
    };
  };
}>;

function toAttemptSummary(a: LatestAttemptRow): AttemptSummary {
  const ts = a.completedAt ?? a.startedAt;
  return {
    id: a.id,
    assignmentId: a.assignmentId,
    score: a.score,
    total: a.total,
    completedAt: ts.toISOString(),
  };
}

export async function findStudentsWithLatestAttempt(
  classroomId: number,
  primaryOperation: OperationCode,
): Promise<StudentRosterRow[]> {
  const students: StudentWithLatestAttemptRow[] = await prisma.student.findMany({
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

    return {
      id: s.id,
      name: s.name,
      username: s.username,
      mustSetPassword: s.mustSetPassword,
      level,
      lastAttempt: s.Attempt.length ? toAttemptSummary(s.Attempt[0]) : null,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Bulk create                                                                 */
/* -------------------------------------------------------------------------- */

export type CreateStudentData = {
  firstName: string;
  lastName: string;
  username: string;
};

export type CreatedStudentWithSetupCode = {
  id: number;
  name: string;
  username: string;
  setupCode: string;
  setupCodeExpiresAt: Date;
};

export async function createManyForClassroom(
  classroomId: number,
  students: CreateStudentData[],
): Promise<{
  created: CreatedStudentWithSetupCode[];
  roster: StudentRosterRow[];
}> {
  if (!students.length) {
    return { created: [], roster: [] };
  }

  const created: CreatedStudentWithSetupCode[] = [];
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

  return { created, roster: [] };
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
