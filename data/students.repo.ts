import { prisma } from '@/data/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { hashSetupCode } from '@/core/auth/setupCodes';

export async function findStudentsWithLatestAttempt(classroomId: number) {
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

  return students.map((s: (typeof students)[number]) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    level: s.level,
    mustSetPassword: s.mustSetPassword,
    lastAttempt: s.Attempt.length ? s.Attempt[0] : null,
  }));
}

export async function findById(id: number) {
  return prisma.student.findUnique({
    where: { id },
  });
}

// Extra helpers for teacher dashboard (roster CRUD)

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
  setupCode: string; // plaintext returned ONLY once
  setupCodeExpiresAt: Date;
};

function generateSetupCode(): string {
  // 6-digit numeric (easy to type)
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, '0');
}

function expiresAtFromNowDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function createManyForClassroom(
  classroomId: number,
  students: CreateStudentData[],
): Promise<{
  created: CreatedStudentWithSetupCode[];
  roster: ReturnType<typeof findStudentsWithLatestAttempt> extends Promise<infer R> ? R : never;
}> {
  if (!students.length) {
    return { created: [], roster: await findStudentsWithLatestAttempt(classroomId) };
  }

  const created: CreatedStudentWithSetupCode[] = [];
  const setupExpiresAt = expiresAtFromNowDays(7);

  // Create students one-by-one so we can return setup codes for ONLY the ones actually created.
  // (createMany can't return created rows/ids).
  for (const s of students) {
    const name = `${s.firstName} ${s.lastName}`.trim();
    const setupCode = generateSetupCode();
    const setupCodeHash = hashSetupCode(setupCode);

    // Placeholder password hash prevents login until activation sets a real password.
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
      // If username already exists, skip it (matches old skipDuplicates behavior)
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        continue;
      }
      throw err;
    }
  }

  const roster = await findStudentsWithLatestAttempt(classroomId);
  return { created, roster };
}

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

export async function deleteByClassroomId(classroomId: number) {
  return prisma.student.deleteMany({
    where: { classroomId },
  });
}
