import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/data/prisma';
import { readJson, handleApiError, setTeacherSessionCookie } from '@/app';
import { createTeacherSession } from '@/core';

const LoginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const raw = await readJson(req);
    const { email, password } = LoginBodySchema.parse(raw);

    const normalizedEmail = email.trim().toLowerCase();

    const teacher = await prisma.teacher.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        passwordHash: true,
      },
    });

    const ok = teacher ? await bcrypt.compare(password, teacher.passwordHash) : false;
    if (!teacher || !ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { token, maxAgeSeconds } = await createTeacherSession(teacher.id);

    const res = NextResponse.json(
      {
        ok: true,
        teacher: { id: teacher.id, name: teacher.name, email: teacher.email },
      },
      { status: 200 },
    );

    setTeacherSessionCookie(res, token, maxAgeSeconds);
    return res;
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
