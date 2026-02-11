import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'danger' | 'warning' | 'success' | 'muted' | 'primary';
  text?: string;
}

export function Badge({ text, tone = 'muted', children, className, ...props }: BadgeProps) {
  const tones = {
    danger: 'bg-[hsl(var(--danger)/0.12)] text-[hsl(var(--danger))]',
    warning: 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))]',
    success: 'bg-[hsl(var(--success)/0.12)] text-[hsl(var(--success))]',
    muted: 'bg-[hsl(var(--surface-2))] text-[hsl(var(--muted-fg))]',
    primary: 'bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))]',
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
