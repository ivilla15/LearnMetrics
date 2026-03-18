import { Tone, TextSize } from '@/types';

export function Pill(text: string, tone: Tone, textSize: TextSize = 'xs') {
  const toneCls =
    tone === 'primary'
      ? 'bg-white text-[hsl(var(--brand))] border-[hsl(var(--brand))]'
      : tone === 'danger'
        ? 'bg-[hsl(var(--danger)/0.10)] text-[hsl(var(--danger))] border-[hsl(var(--danger)/0.22)]'
        : tone === 'warning'
          ? 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.25)]'
          : tone === 'success'
            ? 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.25)]'
            : 'bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-fg))] border-[hsl(var(--border))]';

  const sizeCls =
    textSize === 'xs'
      ? 'text-[11px]'
      : textSize === 'sm'
        ? 'text-sm'
        : textSize === 'base'
          ? 'text-base'
          : textSize === 'lg'
            ? 'text-lg'
            : textSize;

  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2 py-0.5 font-semibold border',
        sizeCls,
        toneCls,
      ].join(' ')}
    >
      {text}
    </span>
  );
}
