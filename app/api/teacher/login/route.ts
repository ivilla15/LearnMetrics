import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SESSION_TTL_DAYS = 14;

function expiresAtFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function readBody(req: Request) {
  const j = await req.clone().json();
  if (j && typeof j === 'object') return j;

  const fd = await req.clone().formData();
  const obj = Object.fromEntries(fd.entries());
  if (obj && Object.keys(obj).length > 0) return obj;

  return null;
}

export async function POST(req: Request) {
  const body = await readBody(req);

  const email = String((body as any)?.email ?? '')
    .trim()
    .toLowerCase();
  const password = String((body as any)?.password ?? '').trim();

  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
  }

  const teacher = await prisma.teacher.findUnique({ where: { email } });

  // teacher.password must be a bcrypt hash
  const ok = teacher ? await bcrypt.compare(password, teacher.password) : false;

  if (!teacher || !ok) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = crypto.randomBytes(32).toString('base64url');

  await prisma.teacherSession.create({
    data: {
      token,
      teacherId: teacher.id,
      expiresAt: expiresAtFromNow(SESSION_TTL_DAYS),
    },
  });

  const res = NextResponse.json(
    {
      ok: true,
      teacher: { id: teacher.id, name: teacher.name, email: teacher.email },
    },
    { status: 200 },
  );

  res.cookies.set('teacher_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return res;
}
