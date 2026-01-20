import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { prisma } from '@/data/prisma';
import { clearTeacherSessionCookie, handleApiError } from '@/app';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('teacher_session')?.value;

    if (token) {
      await prisma.teacherSession.delete({ where: { token } }).catch(() => undefined);
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    clearTeacherSessionCookie(res);
    return res;
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
