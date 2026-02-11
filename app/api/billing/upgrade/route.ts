import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { readJson, handleApiError } from '@/app';
import { jsonError } from '@/utils';

const BodySchema = z.object({
  plan: z.enum(['TRIAL', 'PRO']),
});

function addDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const raw = await readJson(req);
    const { plan } = BodySchema.parse(raw);

    const now = new Date();

    // Minimal behavior:
    // - TRIAL: active + 30 days
    // - PRO: active + no trialEndsAt needed
    const entitlement = await prisma.teacherEntitlement.upsert({
      where: { teacherId: auth.teacher.id },
      update: {
        plan,
        status: 'ACTIVE',
        trialEndsAt: plan === 'TRIAL' ? addDays(now, 30) : null,
      },
      create: {
        teacherId: auth.teacher.id,
        plan,
        status: 'ACTIVE',
        trialEndsAt: plan === 'TRIAL' ? addDays(now, 30) : null,
      },
      select: { plan: true, status: true, trialEndsAt: true },
    });

    return NextResponse.json({ ok: true, entitlement }, { status: 200 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
