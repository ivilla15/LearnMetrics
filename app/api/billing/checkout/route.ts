// app/api/billing/checkout/route.ts
import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { requireTeacher } from '@/core';

export const runtime = 'nodejs';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_BY_PLAN: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO_ID,
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = (url.searchParams.get('plan') ?? 'pro').toLowerCase();
  const wantJson = url.searchParams.get('json') === '1' || url.searchParams.get('json') === 'true';

  const auth = await requireTeacher();
  if (!auth.ok) {
    const next = `/api/billing/checkout?plan=${encodeURIComponent(plan)}${wantJson ? '&json=1' : ''}`;
    redirect(`/teacher/login?next=${encodeURIComponent(next)}`);
  }

  const priceId = PRICE_BY_PLAN[plan];
  if (!priceId) {
    // keep behaviour consistent
    if (wantJson) {
      return new Response(JSON.stringify({ ok: false, error: 'invalid_plan' }), { status: 400 });
    }
    redirect('/teacher/settings?error=invalid_plan');
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: auth.teacher.email,
    success_url: `${origin}/teacher/settings?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/teacher/settings?checkout=canceled`,
    metadata: { teacherId: String(auth.teacher.id), plan },
    subscription_data: { metadata: { teacherId: String(auth.teacher.id), plan } },
  });

  if (!session.url) {
    if (wantJson) {
      return new Response(JSON.stringify({ ok: false, error: 'session_failed' }), { status: 500 });
    }
    redirect('/teacher/settings?error=session_failed');
  }

  if (wantJson) {
    return new Response(JSON.stringify({ ok: true, url: session.url }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }

  redirect(session.url);
}
