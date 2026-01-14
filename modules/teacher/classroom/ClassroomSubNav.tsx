'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib';
import { ClassroomSubNavItems } from './ClassroomSubNavLinks';

type Props = {
  classroomId: number;
  currentPath: string;
  className?: string;
  variant?: 'tabs' | 'pills';
};

function isActivePath(currentPath: string, href: string, exact?: boolean) {
  if (exact) return currentPath === href;
  return currentPath === href || currentPath.startsWith(href + '/');
}

export function ClassroomSubNav({ classroomId, currentPath, className, variant = 'tabs' }: Props) {
  const items = React.useMemo(
    () =>
      ClassroomSubNavItems.map((item) => ({
        ...item,
        hrefString: item.href(classroomId),
      })),
    [classroomId],
  );

  return (
    <div className={cn('w-full', className)}>
      {variant === 'tabs' ? (
        <div className="border-b border-[hsl(var(--border))]">
          <nav className="flex gap-6">
            {items.map((item) => {
              const active = isActivePath(currentPath, item.hrefString, item.exact);

              return (
                <Link
                  key={item.hrefString}
                  href={item.hrefString}
                  className={cn(
                    'relative -mb-px px-1 pb-3 text-sm font-medium transition-colors',
                    active
                      ? 'text-[hsl(var(--fg))]'
                      : 'text-[hsl(var(--muted-fg))] hover:text-[hsl(var(--fg))]',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute left-0 right-0 -bottom-[1px] h-[2px] rounded-full transition-opacity',
                      active ? 'opacity-100 bg-[hsl(var(--brand))]' : 'opacity-0',
                    )}
                  />
                </Link>
              );
            })}
          </nav>
        </div>
      ) : (
        <nav className="flex flex-wrap gap-2">
          {items.map((item) => {
            const active = isActivePath(currentPath, item.hrefString, item.exact);

            return (
              <Link
                key={item.hrefString}
                href={item.hrefString}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-[hsl(var(--brand))] bg-[hsl(var(--brand))] text-white'
                    : 'border-[hsl(var(--border))] bg-[hsl(var(--surface))] text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                )}
                aria-current={active ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
