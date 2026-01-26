import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'danger' | 'warning' | 'success' | 'muted';
  text?: string;
}

export function Badge({ text, tone = 'muted', children, className, ...props }: BadgeProps) {
  const tones = {
    danger:
      'bg-[hsl(var(--danger)/0.10)] text-[hsl(var(--danger))] border-[hsl(var(--danger)/0.22)]',
    warning:
      'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.25)]',
    success:
      'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.25)]',
    muted: 'bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-fg))] border-[hsl(var(--border))]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border transition-colors',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children || text}
    </span>
  );
}
