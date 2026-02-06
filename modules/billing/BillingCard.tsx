'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
  Button,
} from '@/components';
import type { EntitlementDTO, SubscriptionSummary } from '@/types';

export function BillingCard() {
  const [ent, setEnt] = useState<EntitlementDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [summary, setSummary] = useState<SubscriptionSummary>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await fetch('/api/teacher/entitlement');
      const json = await res.json().catch(() => null);

      if (cancelled) return;
      setEnt(json?.ok ? (json.entitlement ?? null) : null);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSummary() {
      setSummaryLoading(true);
      const res = await fetch('/api/billing/subscription-summary');
      const json = await res.json().catch(() => null);
      if (cancelled) return;

      setSummary(json?.ok ? (json.summary ?? null) : null);
      setSummaryLoading(false);
    }

    void loadSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openManageBilling() {
    try {
      setCtaLoading(true);
      const res = await fetch('/api/billing/manage', { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (json?.ok && json.url) {
        window.location.href = json.url;
      }
    } finally {
      setCtaLoading(false);
    }
  }

  const planLabel = ent?.plan === 'PRO' ? 'Pro' : ent?.plan === 'SCHOOL' ? 'School' : 'Trial';

  const statusLabel =
    ent?.status === 'ACTIVE' ? 'Active' : ent?.status === 'CANCELED' ? 'Canceled' : 'Expired';

  const ctaLabel =
    ent?.plan === 'PRO' && ent?.status === 'ACTIVE' ? 'Manage billing' : 'Upgrade to Pro';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
        <CardDescription>Manage your plan and payments</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 min-h-[150px]">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-10 w-40" />
          </div>
        ) : !ent ? (
          <div className="text-[15px] text-[hsl(var(--muted-fg))]">
            No billing information found yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                Plan
              </div>
              <div className="mt-2 text-[17px] font-semibold">{planLabel}</div>
            </div>

            <div>
              <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                Status
              </div>
              <div className="mt-2 text-[17px] font-semibold">{statusLabel}</div>
            </div>

            {summaryLoading ? (
              <div className="sm:col-span-2">
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Billing
                </div>
                <div className="mt-2">
                  <Skeleton className="h-5 w-44" />
                </div>
              </div>
            ) : summary?.currentPeriodEnd ? (
              <div className="sm:col-span-2">
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  {summary.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}
                </div>
                <div className="mt-2 text-[17px] font-semibold">
                  {new Date(summary.currentPeriodEnd).toLocaleDateString()}
                </div>
              </div>
            ) : null}

            {ent.trialEndsAt ? (
              <div className="sm:col-span-2">
                <div className="text-[13px] font-medium uppercase tracking-wider text-[hsl(var(--muted-fg))]">
                  Trial ends
                </div>
                <div className="mt-2 text-[17px] font-semibold">
                  {new Date(ent.trialEndsAt).toLocaleDateString()}
                </div>
              </div>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          {loading ? (
            <Skeleton className="h-10 w-40" />
          ) : (
            <Button onClick={openManageBilling} disabled={ctaLoading}>
              {ctaLoading ? 'Opening…' : ctaLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
