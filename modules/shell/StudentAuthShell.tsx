import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

import { Button } from '@/components/Button';

export function StudentAuthShell({
  children,
  closeHref = '/student/login',
  className,
}: {
  children: ReactNode;
  closeHref?: string;
  className?: string;
}) {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col px-6 py-10">
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" aria-label="Close">
            <Link href={closeHref}>
              <span aria-hidden className="text-xl leading-none">
                ×
              </span>
            </Link>
          </Button>
        </div>

        <div className={cn('mt-6', className)}>{children}</div>
      </div>
    </div>
  );
}
