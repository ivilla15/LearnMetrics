import bcrypt from 'bcryptjs';
import { ConflictError } from '@/core/errors';
import { prisma } from '@/data/prisma';
import {
  generateSetupCode,
  hashSetupCode,
  expiresAtFromNowHours,
  SETUP_CODE_TTL_HOURS,
} from '@/core/auth/setupCodes';

import type { BulkCreateStudentArgs, StudentRosterRow } from '@/types';
import type { AttemptSummary } from '@/types/attempts';
import { requireWithinTrialLimits } from '@/core/billing/entitlement';

async function requireTeacherOwnsClassroom(teacherId: number, classroomId: number) {
  const ok = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId },
    select: { id: true },
  });
  if (!ok) throw new ConflictError('Not allowed');
}

export async function bulkCreateClassroomStudents(args: BulkCreateStudentArgs): Promise<{
  students: StudentRosterRow[];
  setupCodes: { studentId: number; username: string; setupCode: string }[];
}> {
  const { teacherId, classroomId, students } = args;

  await requireTeacherOwnsClassroom(teacherId, classroomId);

  const gate = await requireWithinTrialLimits({
    teacherId,
    classroomId,
    kind: 'ADD_STUDENTS',
    addStudentsCount: students.length,
  });
  if (!gate.ok) throw new ConflictError(gate.error);

  const saltRounds = 10;
  const expiresAt = expiresAtFromNowHours(SETUP_CODE_TTL_HOURS);

  const prepared = await Promise.all(
    students.map(async (s) => {
      const setupCode = generateSetupCode();
      const setupCodeHash = hashSetupCode(setupCode);

      const tempPassword = await bcrypt.hash(`${setupCode}:${cryptoRandomString()}`, saltRounds);

      return {
        firstName: s.firstName,
        lastName: s.lastName,
        username: s.username.trim(),
        password: tempPassword,
        level: Math.max(1, Math.min(12, Math.trunc(s.level))),
        setupCode,
        setupCodeHash,
      };
    }),
  );

  const created: StudentRosterRow[] = await prisma.$transaction(async (tx) => {
    await tx.student.createMany({
      data: prepared.map((p) => ({
        classroomId,
        name: `${p.firstName} ${p.lastName}`.trim(),
        username: p.username,
        password: p.password,
        level: p.level,
        setupCodeHash: p.setupCodeHash,
        setupCodeExpiresAt: expiresAt,
        mustSetPassword: true,
      })),
      skipDuplicates: true,
    });

    const roster = await tx.student.findMany({
      where: { classroomId },
      select: {
        id: true,
        name: true,
        username: true,
        level: true,
        mustSetPassword: true,
        Attempt: {
          orderBy: { completedAt: 'desc' },
          take: 1,
          select: { id: true, assignmentId: true, score: true, total: true, completedAt: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roster.map((s) => {
      const a = s.Attempt.length ? s.Attempt[0] : null;

      const lastAttempt: AttemptSummary | null = a
        ? {
            id: a.id,
            assignmentId: a.assignmentId,
            score: a.score,
            total: a.total,
            completedAt: a.completedAt.toISOString(),
          }
        : null;

      return {
        id: s.id,
        name: s.name,
        username: s.username,
        level: s.level,
        mustSetPassword: s.mustSetPassword,
        lastAttempt,
      };
    });
  });

  const createdByUsername = new Map(created.map((s) => [s.username, s.id]));

  const setupCodes = prepared
    .map((p) => {
      const studentId = createdByUsername.get(p.username);
      return studentId ? { studentId, username: p.username, setupCode: p.setupCode } : null;
    })
    .filter((x): x is { studentId: number; username: string; setupCode: string } => x !== null);

  return { students: created, setupCodes };
}

function cryptoRandomString() {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}
