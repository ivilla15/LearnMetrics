import { NextResponse } from 'next/server';
import { requireTeacher } from '@/core';
import { prisma } from '@/data/prisma';
import { jsonError } from '@/utils';
import type { EntitlementDTO } from '@/types';

export async function GET() {
  const auth = await requireTeacher();
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const ent = await prisma.teacherEntitlement.findUnique({
    where: { teacherId: auth.teacher.id },
    select: {
      plan: true,
      status: true,
      source: true,
      trialEndsAt: true,
      expiresAt: true,
      grantReason: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  const entitlement: EntitlementDTO | null = ent
    ? {
        plan: ent.plan,
        status: ent.status,
        source: ent.source,
        trialEndsAt: ent.trialEndsAt ? ent.trialEndsAt.toISOString() : null,
        expiresAt: ent.expiresAt ? ent.expiresAt.toISOString() : null,
        grantReason: ent.grantReason,
        stripeCustomerId: ent.stripeCustomerId,
        stripeSubscriptionId: ent.stripeSubscriptionId,
      }
    : null;

  return NextResponse.json({ ok: true, entitlement }, { status: 200 });
}
