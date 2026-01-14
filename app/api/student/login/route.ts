import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { z } from 'zod';

import { prisma } from '@/data';
import { readJson, setStudentSessionCookie, handleApiError } from '@/app';
import { createStudentSession } from '@/core';

const LoginBodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const raw = await readJson(req);
    const { username, password } = LoginBodySchema.parse(raw);

    const uname = username.trim();

    const student = await prisma.student.findUnique({
      where: { username: uname },
      select: {
        id: true,
        name: true,
        username: true,
        level: true,
        password: true,
        mustSetPassword: true,
      },
    });

    const ok = student ? await bcrypt.compare(password, student.password) : false;
    if (!student || !ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (student.mustSetPassword) {
      return NextResponse.json({ error: 'ACCOUNT_NOT_ACTIVATED' }, { status: 409 });
    }

    const { token, maxAgeSeconds } = await createStudentSession(student.id);

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

    setStudentSessionCookie(res, token, maxAgeSeconds);
    return res;
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
