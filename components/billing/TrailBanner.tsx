import * as React from 'react';
import { Button } from '@/components';

type Props = {
  trialEndsAt: string | Date | null | undefined;
  className?: string;
};

function formatDateShort(d: Date) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function safeParseDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? null : input;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysLeft(end: Date) {
  const ms = end.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function TrialBanner({ trialEndsAt, className }: Props) {
  const end = safeParseDate(trialEndsAt);
  const endLabel = end ? formatDateShort(end) : null;
  const remaining = end ? daysLeft(end) : null;

  const subtitle = endLabel
    ? `Your free trial ends on ${endLabel}. No payment required unless you upgrade.`
    : 'Your free trial is active. No payment required unless you upgrade.';

  const pill = remaining !== null ? `${remaining} day${remaining === 1 ? '' : 's'} left` : 'Trial';

  return (
    <section
      aria-label="Free trial status"
      className={[
        'w-full border border-[hsl(var(--brand)/0.35)]',
        'bg-[hsl(var(--brand))] text-white shadow-[0_10px_30px_rgba(0,0,0,0.12)]',
        'px-5 py-4 sm:px-6 sm:py-5',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
              {pill}
            </span>

            <h2 className="text-base font-semibold sm:text-lg">Free trial active</h2>
          </div>

          <p className="mt-2 text-sm text-white/90 sm:text-[15px]">{subtitle}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            href="/billing"
            variant="outline"
            className="border-white/25 text-white bg-white/10 hover:bg-white/15 hover:border-white/35"
          >
            Upgrade
          </Button>

          <Button
            href="/#pricing"
            variant="outline"
            className="border-white/25 text-white bg-white/10 hover:bg-white/15 hover:border-white/35"
          >
            View plans
          </Button>
        </div>
      </div>
    </section>
  );
}
