// app/api/student/_lib/roster.service.ts
import bcrypt from 'bcrypt';
import { ConflictError, NotFoundError } from '@/core/errors';
import { prisma } from '@/data/prisma';
import * as StudentsRepo from '@/data/students.repo';
import {
  generateSetupCode,
  hashSetupCode,
  expiresAtFromNowHours,
  SETUP_CODE_TTL_HOURS,
} from '@/core/auth/setupCodes';

export type StudentRosterRow = {
  id: number;
  name: string;
  username: string;
  level: number;
  lastAttempt: any | null;
  mustSetPassword: boolean;
};

export type BulkCreateStudentArgs = {
  teacherId: number;
  classroomId: number;
  students: {
    firstName: string;
    lastName: string;
    username: string;
    level: number;
  }[];
};

async function requireTeacherOwnsClassroom(teacherId: number, classroomId: number) {
  const ok = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId },
    select: { id: true },
  });
  if (!ok) throw new ConflictError('Not allowed');
}

function mapRosterRow(s: any): StudentRosterRow {
  return {
    id: s.id,
    name: s.name,
    username: s.username,
    level: s.level,
    lastAttempt: s.lastAttempt ?? null,
    mustSetPassword: Boolean(s.mustSetPassword),
  };
}

export async function bulkCreateClassroomStudents(args: BulkCreateStudentArgs): Promise<{
  students: StudentRosterRow[];
  setupCodes: { studentId: number; username: string; setupCode: string }[];
}> {
  const { teacherId, classroomId, students } = args;

  await requireTeacherOwnsClassroom(teacherId, classroomId);

  const saltRounds = 10;
  const expiresAt = expiresAtFromNowHours(SETUP_CODE_TTL_HOURS);

  // For each student, generate a one-time setup code.
  // We store ONLY the hash. We return the plaintext code ONCE in the response.
  const prepared = await Promise.all(
    students.map(async (s) => {
      const setupCode = generateSetupCode();
      const setupCodeHash = hashSetupCode(setupCode);

      // Temporary password: random bytes hashed. Student must activate to set a real password.
      const tempPassword = (await bcrypt.hash(
        String(setupCode) + ':' + cryptoRandomString(),
        saltRounds,
      )) as string;

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

  // Write students (repo should store password as provided and NOT return password)
  // But we must also set setup fields; easiest is to create normally then update per student.
  // We'll do it in a transaction for consistency.
  const created = await prisma.$transaction(async (tx) => {
    // CreateMany (skip duplicates) — matches your existing behavior
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

    // Return roster rows without passwords
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

    const rows = roster.map((s) => ({
      id: s.id,
      name: s.name,
      username: s.username,
      level: s.level,
      mustSetPassword: s.mustSetPassword,
      lastAttempt: s.Attempt.length ? s.Attempt[0] : null,
    }));

    return rows;
  });

  // We only want setup codes for the students we just attempted to create.
  // Since createMany may skip duplicates, match by username in the final roster.
  const createdByUsername = new Map(created.map((s) => [s.username, s.id]));
  const setupCodes = prepared
    .map((p) => {
      const studentId = createdByUsername.get(p.username);
      if (!studentId) return null; // duplicate skipped
      return { studentId, username: p.username, setupCode: p.setupCode };
    })
    .filter(Boolean) as { studentId: number; username: string; setupCode: string }[];

  return { students: created, setupCodes };
}

// Helper: random string for temp password entropy
function cryptoRandomString() {
  // avoids importing crypto at top-level if you prefer; but safe either way
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
}

export type UpdateStudentArgs = {
  teacherId: number;
  classroomId: number;
  studentId: number;
  input: { name: string; username: string; level: number };
};

export async function updateClassroomStudentById(
  args: UpdateStudentArgs,
): Promise<StudentRosterRow> {
  const { teacherId, classroomId, studentId, input } = args;

  await requireTeacherOwnsClassroom(teacherId, classroomId);

  const existing = await StudentsRepo.findById(studentId);
  if (!existing || existing.classroomId !== classroomId) {
    throw new NotFoundError('Student not found');
  }

  await StudentsRepo.updateById(studentId, {
    name: input.name.trim(),
    username: input.username.trim(),
    level: Math.max(1, Math.min(12, Math.trunc(input.level))),
  });

  const roster: any[] = await StudentsRepo.findStudentsWithLatestAttempt(classroomId);
  const updated = roster.find((s) => s.id === studentId);
  if (!updated) throw new NotFoundError('Student not found after update');

  return mapRosterRow(updated);
}

export type DeleteStudentArgs = {
  teacherId: number;
  classroomId: number;
  studentId: number;
};

export async function deleteClassroomStudentById(args: DeleteStudentArgs): Promise<void> {
  const { teacherId, classroomId, studentId } = args;

  await requireTeacherOwnsClassroom(teacherId, classroomId);

  const existing = await StudentsRepo.findById(studentId);
  if (!existing || existing.classroomId !== classroomId) {
    throw new NotFoundError('Student not found');
  }

  await StudentsRepo.deleteById(studentId);
}
