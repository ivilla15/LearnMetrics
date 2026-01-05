// app/api/student/logout/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/data/prisma';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('student_session')?.value;

  if (token) {
    await prisma.studentSession.delete({ where: { token } }).catch(() => undefined);
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });

  res.cookies.set('student_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    expires: new Date(0),
  });

  return res;
}
