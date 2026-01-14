import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';

import { prisma } from '@/data/prisma';
import { createTeacherSession } from '@/core';
import { jsonError } from '@/utils';
import { readJson, handleApiError, setTeacherSessionCookie } from '@/app';

const SignupBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  signupCode: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const expectedCode = process.env.TEACHER_SIGNUP_CODE;
    if (!expectedCode) return jsonError('Server missing TEACHER_SIGNUP_CODE', 500);

    const raw = await readJson(req);
    const { name, email, password, signupCode } = SignupBodySchema.parse(raw);

    if (signupCode !== expectedCode) return jsonError('Invalid signup code', 403);

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.teacher.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) return jsonError('Email already in use', 409);

    const passwordHash = await bcrypt.hash(password, 10);

    const teacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: passwordHash,
        updatedAt: new Date(),
      },
      select: { id: true, name: true, email: true },
    });

    const { token, maxAgeSeconds } = await createTeacherSession(teacher.id);

    const res = NextResponse.json({ ok: true, teacher }, { status: 201 });
    setTeacherSessionCookie(res, token, maxAgeSeconds);
    return res;
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
