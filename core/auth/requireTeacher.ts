import { cookies } from 'next/headers';
import { prisma } from '@/data/prisma';

export async function requireTeacher() {
  const cookieStore = await cookies();
  const token = cookieStore.get('teacher_session')?.value;

  if (!token) {
    return { ok: false as const, status: 401, error: 'Not signed in' };
  }

  const session = await prisma.teacherSession.findUnique({
    where: { token },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
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
