import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/data/prisma';
import { clearStudentSessionCookie, handleApiError } from '@/app';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('student_session')?.value;

    if (token) {
      await prisma.studentSession.delete({ where: { token } }).catch(() => undefined);
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    clearStudentSessionCookie(res);
    return res;
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
