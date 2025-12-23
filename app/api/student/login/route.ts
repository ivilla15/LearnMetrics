import { prisma } from '@/data/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const username = String(body?.username ?? '').trim();
  const password = String(body?.password ?? '').trim();

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { username } });

  if (!student || student.password !== password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const res = NextResponse.json(
    {
      ok: true,
      student: {
        id: student.id,
        name: student.name,
        username: student.username,
        level: student.level,
      },
    },
    { status: 200 },
  );

  res.cookies.set('student_session', String(student.id), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  return res;
}
