import { redirect } from 'next/navigation';
import Stripe from 'stripe';
import { requireTeacher } from '@/core';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' });

// Map plans → Stripe Price IDs (ensure these envs are set)
const PRICE_BY_PLAN: Record<string, string | undefined> = {
  pro: process.env.STRIPE_PRICE_PRO_ID,
};

export async function GET(req: Request) {
  // 1) Must be logged in as teacher
  const auth = await requireTeacher();
  if (!auth.ok) {
    redirect('/teacher/login');
  }

  try {
    // 2) Parse plan
    const url = new URL(req.url);
    const plan = (url.searchParams.get('plan') ?? 'pro').toLowerCase();

    const priceId = PRICE_BY_PLAN[plan];
    if (!priceId) {
      redirect('/billing?error=invalid_plan');
    }

    // 3) sanity checks
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Missing STRIPE_SECRET_KEY');
      redirect('/billing?error=stripe_not_configured');
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // 4) Create Checkout Session (attach metadata on subscription too)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // optionally pre-fill email for convenience
      customer_email: auth.teacher.email,
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing/cancel`,
      // Put metadata on both the session and subscription (subscription_data ensures subscription has it)
      metadata: {
        teacherId: String(auth.teacher.id),
        plan,
      },
      subscription_data: {
        metadata: {
          teacherId: String(auth.teacher.id),
          plan,
        },
      },
    });

    // 5) Redirect straight to Stripe Checkout
    if (!session.url) {
      console.error('Stripe session missing url', session);
      redirect('/billing?error=session_failed');
    }

    redirect(session.url);
  } catch (err) {
    console.error('Failed to create Stripe Checkout session', err);
    // Generic fallback for the user
    redirect('/billing?error=server_error');
  }
}
