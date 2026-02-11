import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { prisma } from '@/data/prisma';
import { hashSetupCode, constantTimeEqualHex } from '@/core/auth/setupCodes';

import { createStudentSession } from '@/core/auth/studentSessions';
import { setStudentSessionCookie } from '@/app/api/_shared/student-session-cookies';

import { handleApiError } from '@/app/api/_shared/handle-error';
import { readJson } from '@/app/api/_shared/read-json';

const ActivateBodySchema = z.object({
  username: z.string().min(1),
  setupCode: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: Request) {
  try {
    const raw = await readJson(req);
    const { username, setupCode, newPassword } = ActivateBodySchema.parse(raw);

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
      return NextResponse.json(
        { error: 'Account is not eligible for activation' },
        { status: 409 },
      );
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

    const { token, maxAgeSeconds } = await createStudentSession(student.id);

    await prisma.student.update({
      where: { id: student.id },
      data: {
        passwordHash,
        setupCodeHash: null,
        setupCodeExpiresAt: null,
        mustSetPassword: false,
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

    setStudentSessionCookie(res, token, maxAgeSeconds);
    return res;
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
