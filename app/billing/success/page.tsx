import Stripe from 'stripe';
import Link from 'next/link';

import {
  Section,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
} from '@/components';

import { CheckCircle2, Users, CalendarDays, LayoutGrid } from 'lucide-react';
import { LearnMetricsLogo } from '@/modules/marketing/components/LearnMetricsLogo';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

type Props = {
  searchParams: { session_id?: string };
};

function getSubscriptionPeriodEndUnix(subscription?: Stripe.Subscription | null): number | null {
  if (!subscription) return null;

  // Stripe types can lag behind API versions; safely read if present.
  const subRecord = subscription as unknown as { current_period_end?: number | null };
  const val = subRecord.current_period_end;
  return typeof val === 'number' ? val : null;
}

function getProductNameFromExpandedSession(session: Stripe.Checkout.Session): string | null {
  const li = session.line_items?.data?.[0];
  const product = li?.price?.product;

  if (!product) return null;
  if (typeof product === 'string') return null;

  // Expanded product object
  return (product as Stripe.Product).name ?? null;
}

export default async function BillingSuccessPage({ searchParams }: Props) {
  const sessionId = searchParams.session_id;

  if (!sessionId) {
    return (
      <Section className="py-16">
        <div className="mx-auto w-full max-w-4xl">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Payment successful</CardTitle>
              <CardDescription>No session id provided.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button href="/teacher/classrooms" variant="primary">
                Back to dashboard
              </Button>
              <Button href="/billing" variant="secondary">
                Billing page
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'line_items.data.price.product', 'customer'],
    });

    const subscription = session.subscription as Stripe.Subscription | null;

    const planFromMeta = session.metadata?.plan ? String(session.metadata.plan) : null;
    const planFromProduct = getProductNameFromExpandedSession(session);
    const planLabel = (planFromProduct ?? planFromMeta ?? 'Pro').toString();

    const status = subscription?.status ?? 'active';
    const periodEndUnix = getSubscriptionPeriodEndUnix(subscription);

    return (
      <main className="min-h-[calc(100vh-48px)] bg-[hsl(var(--bg))]">
        <header className="flex items-center px-6 py-4 border-b border-[hsl(var(--border))]">
          <Link href="/" className="flex items-center gap-2">
            <LearnMetricsLogo variant="full-blue" />
          </Link>
        </header>
        {/* Full-width “success band” to make the layout feel intentional */}
        <div className="w-full border-b border-[hsl(var(--border))] bg-[hsl(var(--brand)/0.10)]">
          <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:py-14">
            <div className="flex items-start gap-4">
              <span className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--brand))] text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </span>

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-semibold text-[hsl(var(--fg))] sm:text-2xl">
                    Subscription activated
                  </h1>

                  <Badge
                    className="border-0 text-white"
                    style={{ background: 'hsl(var(--brand))' }}
                  >
                    {planLabel}
                  </Badge>
                </div>

                <p className="mt-1 text-sm text-[hsl(var(--muted-fg))] sm:text-base">
                  Your plan is ready. You can start using LearnMetrics right away.
                </p>
              </div>
            </div>
          </div>
        </div>

        <Section className="py-10 sm:py-14">
          <div className="mx-auto w-full max-w-6xl">
            {/* Main Card */}
            <Card className="w-full shadow-[0_20px_60px_rgba(0,0,0,0.08)]">
              <CardContent className="p-6 sm:p-8">
                {/* Details panel */}
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Plan</div>
                      <div className="mt-1 text-sm font-semibold text-[hsl(var(--fg))]">
                        {planLabel}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Status</div>
                      <div className="mt-1 text-sm font-semibold text-[hsl(var(--fg))] capitalize">
                        {status}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">
                        Receipt email
                      </div>
                      <div className="mt-1 text-sm font-semibold text-[hsl(var(--fg))] break-all">
                        {session.customer_email ?? '—'}
                      </div>
                    </div>
                  </div>

                  {periodEndUnix ? (
                    <div className="mt-4 text-sm text-[hsl(var(--muted-fg))]">
                      Current period ends:{' '}
                      <span className="font-semibold text-[hsl(var(--fg))]">
                        {new Date(periodEndUnix * 1000).toLocaleString()}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href="/teacher/classrooms" variant="primary">
                    Back to dashboard
                  </Button>

                  <form action="/api/billing/portal" method="POST">
                    <input type="hidden" name="session_id" value={sessionId} />
                    <Button type="submit" variant="secondary">
                      Manage billing
                    </Button>
                  </form>

                  <Button href="/#pricing" variant="secondary">
                    View pricing
                  </Button>

                  <Link
                    href="/billing"
                    className="self-center text-sm font-semibold text-[hsl(var(--muted-fg))] underline underline-offset-4 hover:text-[hsl(var(--fg))]"
                  >
                    Billing page
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <div className="mt-8">
              <h2 className="text-sm font-semibold text-[hsl(var(--fg))]">Next steps</h2>
              <p className="mt-1 text-sm text-[hsl(var(--muted-fg))]">
                Finish setup in a couple minutes to start running weekly mastery tests.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <Card className="shadow-sm">
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]">
                        <LayoutGrid className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                        Create a classroom
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-sm text-[hsl(var(--muted-fg))]">
                      Start by setting up your class name and grade level.
                    </p>

                    {/* CTA */}
                    <div className="mt-auto pt-4">
                      <Button href="/teacher/classrooms" variant="primary" size="sm">
                        Go to classrooms
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]">
                        <Users className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                        Add students
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-sm text-[hsl(var(--muted-fg))]">
                      Add your roster so students can start practicing.
                    </p>

                    {/* CTA */}
                    <div className="mt-auto pt-4">
                      <Button href="/teacher/classrooms" variant="primary" size="sm">
                        Manage roster
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardContent className="p-5 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]">
                        <CalendarDays className="h-5 w-5" aria-hidden />
                      </span>
                      <div className="text-sm font-semibold text-[hsl(var(--fg))]">
                        Set weekly schedule
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mt-2 text-sm text-[hsl(var(--muted-fg))]">
                      Choose days and a time window for automatic tests.
                    </p>

                    {/* CTA */}
                    <div className="mt-auto pt-4">
                      <Button href="/teacher/classrooms" variant="primary" size="sm">
                        Configure schedules
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </Section>
      </main>
    );
  } catch (err) {
    console.error('Failed to retrieve Stripe session', err);

    return (
      <Section className="py-16">
        <div className="mx-auto w-full max-w-6xl">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Payment succeeded</CardTitle>
              <CardDescription>
                Checkout completed, but we could not fetch the session details.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button href="/teacher/classrooms" variant="primary">
                Back to dashboard
              </Button>
              <Button href="/billing" variant="secondary">
                Billing page
              </Button>
            </CardContent>
          </Card>
        </div>
      </Section>
    );
  }
}
