import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireTeacher } from '@/core';
import { prisma } from '@/data/prisma';
import type { EntitlementDTO } from '@/types';
import Stripe from 'stripe';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

async function getOriginFromHeaders() {
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) return null;
  return `${proto}://${host}`;
}

export async function POST() {
  const auth = await requireTeacher();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }

  const origin = await getOriginFromHeaders();
  if (!origin) {
    return NextResponse.json({ ok: false, error: 'Missing host header' }, { status: 500 });
  }

  const entitlement = await prisma.teacherEntitlement.findUnique({
    where: { teacherId: auth.teacher.id },
    select: {
      plan: true,
      status: true,
      trialEndsAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  const e: EntitlementDTO = {
    plan: entitlement?.plan ?? 'TRIAL',
    status: entitlement?.status ?? 'ACTIVE',
    trialEndsAt: entitlement?.trialEndsAt ? entitlement.trialEndsAt.toISOString() : null,
    stripeCustomerId: entitlement?.stripeCustomerId ?? null,
    stripeSubscriptionId: entitlement?.stripeSubscriptionId ?? null,
  };

  const returnTo = `${origin}/teacher/settings`;

  if (e.stripeCustomerId) {
    const session = await stripe.billingPortal.sessions.create({
      customer: e.stripeCustomerId,
      return_url: returnTo,
    });

    return NextResponse.json({ ok: true, url: session.url }, { status: 200 });
  }

  const checkoutApiUrl = `${origin}/api/billing/checkout?plan=pro&json=1`;
  const res = await fetch(checkoutApiUrl, {
    method: 'GET',
    headers: { cookie: (await headers()).get('cookie') ?? '' },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => null);
    return NextResponse.json(
      { ok: false, error: 'checkout_failed', detail: text ?? `status:${res.status}` },
      { status: 500 },
    );
  }

  const json = await res.json().catch(() => null);
  if (!json?.ok || !json.url) {
    return NextResponse.json(
      { ok: false, error: 'checkout_no_url', detail: json },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, url: json.url }, { status: 200 });
}
