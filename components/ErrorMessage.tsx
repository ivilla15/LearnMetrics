import { cn } from '@/lib/utils';

export function ErrorMessage({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius)]',
        'bg-[hsl(var(--danger)/0.12)]',
        'border border-[hsl(var(--danger)/0.25)]',
        'px-3 py-2',
        'text-sm text-[hsl(var(--danger))]',
        className,
      )}
    >
      {message}
    </div>
  );
}
