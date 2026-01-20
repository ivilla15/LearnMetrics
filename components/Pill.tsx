import { Tone } from './types';

export function pill(text: string, tone: Tone) {
  const cls =
    tone === 'danger'
      ? 'bg-[hsl(var(--danger)/0.10)] text-[hsl(var(--danger))] border-[hsl(var(--danger)/0.22)]'
      : tone === 'warning'
        ? 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.25)]'
        : tone === 'success'
          ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.25)]'
          : 'bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-fg))] border-[hsl(var(--border))]';

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border',
        cls,
      ].join(' ')}
    >
      {text}
    </span>
  );
}
