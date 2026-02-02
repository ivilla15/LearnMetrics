import Link from 'next/link';

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const reason = sp.reason;
  const plan = sp.plan ?? 'pro';

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 space-y-6">
      <h1 className="text-3xl font-semibold">Billing</h1>

      {reason === 'expired' ? (
        <p className="text-[hsl(var(--muted-fg))]">
          Your trial ended. Upgrade to keep using LearnMetrics.
        </p>
      ) : (
        <p className="text-[hsl(var(--muted-fg))]">Choose a plan to continue.</p>
      )}

      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 space-y-3">
        <div className="text-sm text-[hsl(var(--muted-fg))]">Selected plan</div>
        <div className="text-xl font-semibold capitalize">{plan}</div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--brand))] px-5 py-2 text-white font-medium hover:bg-[hsl(var(--brand)/0.92)]"
            href="/api/billing/checkout?plan=pro"
          >
            Continue to checkout
          </Link>

          <Link className="underline text-sm" href="/">
            Back to home
          </Link>
        </div>

        <p className="text-xs text-[hsl(var(--muted-fg))]">
          Checkout can be wired to Stripe next. This page is the “upgrade wall” for now.
        </p>
      </div>
    </main>
  );
}
