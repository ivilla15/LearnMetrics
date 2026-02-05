import Stripe from 'stripe';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

export async function POST(req: Request) {
  const form = await req.formData();
  const sessionId = String(form.get('session_id') ?? '');

  if (!sessionId) {
    redirect('/billing?error=missing_session');
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

  if (!customerId) {
    redirect('/billing?error=missing_customer');
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/billing`,
  });

  redirect(portal.url);
}
