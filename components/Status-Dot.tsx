import { Tone } from './types';

export function StatusDot({ tone }: { tone: Tone }) {
  const cls =
    tone === 'success'
      ? 'bg-[hsl(var(--success))]'
      : tone === 'warning'
        ? 'bg-[hsl(var(--warning))]'
        : tone === 'danger'
          ? 'bg-[hsl(var(--danger))]'
          : 'bg-[hsl(var(--muted-fg))]';

  return <span aria-hidden className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
}
