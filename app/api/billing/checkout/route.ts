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

  const auth = await requireTeacher();
  if (!auth.ok) {
    const next = `/api/billing/checkout?plan=${encodeURIComponent(plan)}`;
    redirect(`/teacher/login?next=${encodeURIComponent(next)}`);
  }

  const priceId = PRICE_BY_PLAN[plan];
  if (!priceId) redirect('/billing?error=invalid_plan');

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: auth.teacher.email,
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing/cancel`,
    metadata: { teacherId: String(auth.teacher.id), plan },
    subscription_data: { metadata: { teacherId: String(auth.teacher.id), plan } },
  });

  if (!session.url) redirect('/billing?error=session_failed');
  redirect(session.url);
}
