import { NextResponse } from 'next/server';
import { z } from 'zod';

import { handleApiError, readJson } from '@/app';
import { expireTeacherTrial } from '@/core/billing/expireTeacherTrial';
import crypto from 'crypto';

function safeEqual(a: string, b: string): boolean {
  const aBuf = crypto.createHash('sha256').update(a).digest();
  const bBuf = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(aBuf, bBuf);
}

const BodySchema = z.object({
  teacherId: z.number().int().positive(),
});

export async function POST(req: Request) {
  try {
    const adminKey = process.env.ADMIN_API_KEY;
    if (!adminKey) {
      return NextResponse.json(
        { ok: false, error: 'Server missing ADMIN_API_KEY' },
        { status: 500 },
      );
    }

    const provided = req.headers.get('x-admin-key') ?? '';
    if (!safeEqual(provided, adminKey)) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await readJson(req);
    const { teacherId } = BodySchema.parse(raw);

    await expireTeacherTrial(teacherId);

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
