// src/core/auth.ts
import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function parseIdFromHeader(raw: string | null, headerName: string): number {
  if (!raw) {
    throw new AuthError(`Missing ${headerName} header`);
  }

  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AuthError(`Invalid ${headerName} header`);
  }

  return id;
}

export async function requireTeacher(_request: Request) {
  // TEMP: dev-friendly behavior until NextAuth is wired in.
  // We just use the first teacher in the DB.
  const teacher = await prisma.teacher.findFirst();

  if (!teacher) {
    throw new AuthError('No teacher exists in database.');
  }

  return teacher;
}

// Student: use for student-only routes
export async function requireStudent(request: Request) {
  const headerName = 'x-student-id';
  const raw = request.headers.get(headerName);
  const id = parseIdFromHeader(raw, headerName);

  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  return student;
}
