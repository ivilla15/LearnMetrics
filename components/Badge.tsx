import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'danger' | 'warning' | 'success' | 'muted';
  text?: string;
}

export function Badge({ text, tone = 'muted', children, className, ...props }: BadgeProps) {
  const tones = {
    danger: 'bg-danger/10 text-danger border-danger/25',
    warning: 'bg-warning/12 text-warning border-warning/25',
    success: 'bg-success/12 text-success border-success/25',
    muted: 'bg-surface-2 text-muted-fg border-border',
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
