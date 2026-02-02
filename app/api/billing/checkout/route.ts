import { redirect } from 'next/navigation';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const plan = url.searchParams.get('plan') ?? 'pro';

  // TODO: Replace with Stripe Checkout session creation
  // For now, just show a friendly placeholder.
  redirect(`/billing?plan=${encodeURIComponent(plan)}`);
}
