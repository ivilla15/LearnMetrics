import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/data/prisma';
import { createTeacherSession } from '@/core';
import { jsonError } from '@/utils';
import { readJson, handleApiError, setTeacherSessionCookie } from '@/app';

const SignupBodySchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
  try {
    const raw = await readJson(req);
    const { name, email, password } = SignupBodySchema.parse(raw);

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.teacher.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) return jsonError('Email already in use', 409);

    const passwordHash = await bcrypt.hash(password, 10);

    const now = new Date();
    const trialEndsAt = addDays(now, 30);

    const teacher = await prisma.teacher.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: passwordHash,
        updatedAt: now,
        entitlement: {
          create: {
            plan: 'TRIAL',
            status: 'ACTIVE',
            trialEndsAt,
          },
        },
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
