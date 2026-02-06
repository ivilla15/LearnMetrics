'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button, useToast } from '@/components';

type Props = {
  plan: 'TRIAL' | 'PRO';
};

export default function BillingCheckoutClient({ plan }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = React.useState(false);

  async function activate() {
    if (busy) return;

    try {
      setBusy(true);

      const res = await fetch('/api/billing/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        toast(json?.error ?? 'Could not update plan.', 'error');
        return;
      }

      toast(plan === 'PRO' ? 'Pro activated.' : 'Trial started.', 'success');
      router.push('/teacher/classrooms');
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" size="lg" className="w-full" onClick={activate} disabled={busy}>
        {busy ? 'Processing…' : plan === 'PRO' ? 'Activate Pro' : 'Start Free Trial'}
      </Button>

      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full"
        onClick={() => router.push('/#pricing')}
        disabled={busy}
      >
        Back to pricing
      </Button>
    </div>
  );
}
