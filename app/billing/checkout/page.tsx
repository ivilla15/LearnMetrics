import { redirect } from 'next/navigation';
import { requireTeacher } from '@/core';
import { Section, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components';
import BillingCheckoutClient from '@/modules/billing/ui';

type Props = {
  searchParams?: Promise<{ plan?: string }>;
};

function normalizePlan(raw?: string) {
  const p = (raw ?? '').toLowerCase().trim();
  if (p === 'pro') return 'PRO' as const;
  if (p === 'trial' || p === 'free' || p === 'free-trial') return 'TRIAL' as const;
  return 'PRO' as const;
}

export default async function BillingCheckoutPage({ searchParams }: Props) {
  const auth = await requireTeacher();
  if (!auth.ok) redirect('/teacher/login');

  const sp = (await searchParams) ?? {};
  const plan = normalizePlan(sp.plan);

  return (
    <Section className="min-h-[calc(100vh-2rem)] flex items-center justify-center">
      <Card className="w-full max-w-xl shadow-sm">
        <CardHeader>
          <CardTitle>Checkout</CardTitle>
          <CardDescription>
            {plan === 'PRO'
              ? 'Activate Pro ($9.99 / month).'
              : 'Start your free trial (1 month full access).'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6">
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-semibold">
                {plan === 'PRO' ? 'Pro Plan' : 'Free Trial'}
              </div>
              <div className="text-2xl font-semibold">
                {plan === 'PRO' ? '$9.99' : '$0'}
                <span className="ml-2 text-sm text-[hsl(var(--muted-fg))]">
                  {plan === 'PRO' ? '/month' : 'for 1 month'}
                </span>
              </div>
            </div>

            <ul className="mt-4 list-disc pl-5 text-sm text-[hsl(var(--muted-fg))] space-y-1">
              {plan === 'PRO' ? (
                <>
                  <li>Multiple classrooms</li>
                  <li>Multiple schedules per classroom</li>
                  <li>More analytics over time</li>
                </>
              ) : (
                <>
                  <li>1 classroom</li>
                  <li>1 schedule per classroom</li>
                  <li>Up to 30 students per classroom</li>
                </>
              )}
            </ul>
          </div>

          <BillingCheckoutClient plan={plan} />
        </CardContent>
      </Card>
    </Section>
  );
}
