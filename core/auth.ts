// src/core/auth.ts
import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

// Read a header and coerce to a positive integer
function parseIdFromHeader(value: string | null, headerName: string): number {
  if (!value) {
    throw new AuthError(`Missing ${headerName} header`);
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AuthError(`Invalid ${headerName} value`);
  }

  return id;
}

// Teacher: use for teacher-only routes
export async function requireTeacher(request: Request) {
  const headerName = 'x-teacher-id';
  const raw = request.headers.get(headerName);
  const id = parseIdFromHeader(raw, headerName);

  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) {
    throw new NotFoundError('Teacher not found');
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
