import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/data/prisma';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get('teacher_session')?.value;

  if (token) {
    await prisma.teacherSession.delete({ where: { token } }).catch(() => {});
  }

  const res = NextResponse.json({ ok: true }, { status: 200 });

  res.cookies.set('teacher_session', '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });

  return res;
}
