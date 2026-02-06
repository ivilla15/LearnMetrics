import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { requireTeacher } from '@/core';
import { prisma } from '@/data/prisma';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

export async function POST(req: Request) {
  const form = await req.formData();
  const sessionId = String(form.get('session_id') ?? '');

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Flow A: keep existing behavior (portal from a checkout session)
  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer?.id;

    if (!customerId) redirect('/billing?error=missing_customer');

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/billing`,
    });

    redirect(portal.url);
  }

  // Flow B: portal from signed-in teacher (Profile page “Manage billing”)
  const auth = await requireTeacher();
  if (!auth.ok) {
    const next = `/teacher/profile`;
    redirect(`/teacher/login?next=${encodeURIComponent(next)}`);
  }

  const entitlement = await prisma.teacherEntitlement.findUnique({
    where: { teacherId: auth.teacher.id },
    select: { stripeCustomerId: true },
  });

  const customerId = entitlement?.stripeCustomerId ?? null;
  if (!customerId) {
    redirect('/teacher/profile?billing=missing_customer');
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/teacher/profile`,
  });

  redirect(portal.url);
}
