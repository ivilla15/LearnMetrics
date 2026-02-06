import { NextResponse } from 'next/server';
import { requireTeacher } from '@/core';
import { prisma } from '@/data/prisma';
import { jsonError } from '@/utils';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

function toIsoFromUnixSeconds(sec: number | null | undefined) {
  return typeof sec === 'number' ? new Date(sec * 1000).toISOString() : null;
}

export async function GET() {
  const auth = await requireTeacher();
  if (!auth.ok) return jsonError(auth.error, auth.status);

  const ent = await prisma.teacherEntitlement.findUnique({
    where: { teacherId: auth.teacher.id },
    select: { stripeSubscriptionId: true },
  });

  if (!ent?.stripeSubscriptionId) {
    return NextResponse.json({ ok: true, summary: null }, { status: 200 });
  }

  const sub: Stripe.Subscription = await stripe.subscriptions.retrieve(ent.stripeSubscriptionId);

  // Stripe removed subscription-level current_period_end; use item-level dates.
  const periodEnds = sub.items.data
    .map((it: Stripe.SubscriptionItem) => it.current_period_end)
    .filter((v: number | null): v is number => typeof v === 'number');

  const maxPeriodEnd = periodEnds.length ? Math.max(...periodEnds) : null;

  return NextResponse.json(
    {
      ok: true,
      summary: {
        currentPeriodEnd: toIsoFromUnixSeconds(maxPeriodEnd),
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        stripeSubscriptionStatus: sub.status,
      },
    },
    { status: 200 },
  );
}
