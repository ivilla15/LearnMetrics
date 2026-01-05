// src/core/auth.ts
import { prisma } from '@/data/prisma';
import { cookies } from 'next/headers';

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

export async function requireStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get('teacher_session')?.value;

  if (!token) {
    return { ok: false as const, status: 401, error: 'Not signed in' };
  }

  const session = await prisma.teacherSession.findUnique({
    where: { token },
    include: { teacher: { select: { id: true, name: true, email: true } } },
  });

  if (!session) {
    return { ok: false as const, status: 401, error: 'Invalid session' };
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.teacherSession.delete({ where: { token } }).catch(() => {});
    return { ok: false as const, status: 401, error: 'Session expired' };
  }

  return { ok: true as const, teacher: session.teacher };
}
