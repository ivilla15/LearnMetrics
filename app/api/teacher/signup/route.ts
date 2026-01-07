import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const SESSION_TTL_DAYS = 14;

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function expiresAtFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function readBody(req: Request) {
  try {
    const j = await req.clone().json();
    if (j && typeof j === 'object') return j;
  } catch {}
  try {
    const fd = await req.clone().formData();
    const obj = Object.fromEntries(fd.entries());
    if (obj && Object.keys(obj).length > 0) return obj;
  } catch {}
  return null;
}

export async function POST(req: Request) {
  const body = await readBody(req);

  const name = String((body as any)?.name ?? '').trim();
  const email = String((body as any)?.email ?? '')
    .trim()
    .toLowerCase();
  const password = String((body as any)?.password ?? '').trim();
  const signupCode = String((body as any)?.signupCode ?? '').trim();

  const expectedCode = process.env.TEACHER_SIGNUP_CODE;
  if (!expectedCode) return jsonError('Server missing TEACHER_SIGNUP_CODE', 500);
  if (!signupCode || signupCode !== expectedCode) return jsonError('Invalid signup code', 403);

  if (!name || !email || !password) return jsonError('Missing name, email, or password', 400);
  if (!email.includes('@')) return jsonError('Invalid email', 400);
  if (password.length < 8) return jsonError('Password must be at least 8 characters', 400);

  const existing = await prisma.teacher.findUnique({ where: { email } });
  if (existing) return jsonError('Email already in use', 409);

  const hash = await bcrypt.hash(password, 10);

  const teacher = await prisma.teacher.create({
    data: {
      name,
      email,
      password: hash,
      updatedAt: new Date(),
    },
    select: { id: true, name: true, email: true },
  });

  // ✅ Create session + set cookie (auto sign-in)
  const token = crypto.randomBytes(32).toString('base64url');

  await prisma.teacherSession.create({
    data: {
      token,
      teacherId: teacher.id,
      expiresAt: expiresAtFromNow(SESSION_TTL_DAYS),
    },
  });

  const res = NextResponse.json({ ok: true, teacher }, { status: 201 });

  res.cookies.set('teacher_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });

  return res;
}
