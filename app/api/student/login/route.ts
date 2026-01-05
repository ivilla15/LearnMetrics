// app/api/student/login/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SESSION_TTL_DAYS = 14;

function expiresAtFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function readBody(req: Request) {
  // JSON
  try {
    const j = await req.clone().json();
    if (j && typeof j === 'object') return j;
  } catch (e) {
    void e;
  }

  // formData
  try {
    const fd = await req.clone().formData();
    const obj = Object.fromEntries(fd.entries());
    if (obj && Object.keys(obj).length > 0) return obj;
  } catch (e) {
    void e;
  }

  return null;
}

export async function POST(req: Request) {
  const body = await readBody(req);

  const username = String((body as any)?.username ?? '').trim();
  const password = String((body as any)?.password ?? '').trim();

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing username or password' }, { status: 400 });
  }

  const student = await prisma.student.findUnique({ where: { username } });

  // DB must store bcrypt hashes
  const ok = student ? await bcrypt.compare(password, student.password) : false;

  if (!student || !ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = crypto.randomBytes(32).toString('base64url');

  await prisma.studentSession.create({
    data: {
      token,
      studentId: student.id,
      expiresAt: expiresAtFromNow(SESSION_TTL_DAYS),
    },
  });

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

  res.cookies.set('student_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return res;
}
