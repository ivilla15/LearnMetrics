import { cookies } from 'next/headers';
import { prisma } from '@/data';

export async function requireStudent() {
  const cookieStore = await cookies();
  const token = cookieStore.get('student_session')?.value;

  if (!token) {
    return { ok: false as const, status: 401, error: 'Not signed in' };
  }

  const session = await prisma.studentSession.findUnique({
    where: { token },
    include: {
      student: {
        select: {
          id: true,
          name: true,
          username: true,
          classroomId: true,
        },
      },
    },
  });

  if (!session) {
    return { ok: false as const, status: 401, error: 'Invalid session' };
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.studentSession.delete({ where: { token } }).catch(() => {});
    return { ok: false as const, status: 401, error: 'Session expired' };
  }

  return { ok: true as const, student: session.student };
}
