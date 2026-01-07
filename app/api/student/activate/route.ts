// app/api/student/activate/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { hashSetupCode, constantTimeEqualHex } from '@/core/auth/setupCodes';

const SESSION_TTL_DAYS = 14;

function expiresAtFromNow(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const username = String(body?.username ?? '').trim();
  const setupCode = String(body?.setupCode ?? '').trim();
  const newPassword = String(body?.newPassword ?? '').trim();

  if (!username || !setupCode || !newPassword) {
    return NextResponse.json(
      { error: 'Missing username, setup code, or password' },
      { status: 400 },
    );
  }

  const student = await prisma.student.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      level: true,
      setupCodeHash: true,
      setupCodeExpiresAt: true,
      mustSetPassword: true,
    },
  });

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 });
  }

  if (!student.setupCodeHash || !student.setupCodeExpiresAt) {
    return NextResponse.json({ error: 'Account is not eligible for activation' }, { status: 409 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  if (!student.mustSetPassword) {
    return NextResponse.json({ error: 'Account is already activated' }, { status: 409 });
  }

  if (student.setupCodeExpiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: 'Setup code expired. Ask your teacher to reset access.' },
      { status: 409 },
    );
  }

  const providedHash = hashSetupCode(setupCode);
  if (!constantTimeEqualHex(student.setupCodeHash, providedHash)) {
    return NextResponse.json({ error: 'Invalid setup code' }, { status: 401 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  // ✅ Declare token in outer scope so we can set cookie after transaction
  const token = crypto.randomBytes(32).toString('base64url');

  await prisma.$transaction(async (tx) => {
    await tx.student.update({
      where: { id: student.id },
      data: {
        password: passwordHash,
        setupCodeHash: null,
        setupCodeExpiresAt: null,
        mustSetPassword: false,
      },
    });

    await tx.studentSession.create({
      data: {
        token,
        studentId: student.id,
        expiresAt: expiresAtFromNow(SESSION_TTL_DAYS),
      },
    });
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
