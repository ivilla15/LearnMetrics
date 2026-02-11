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

  // mobile menu state
  const [open, setOpen] = React.useState(false);

  // close on escape
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const activeItem = items.find((it) => isActivePath(currentPath, it.hrefString, it.exact));

  return (
    <div className={cn('w-full', className)}>
      {/* Desktop / tablet (md and up): original tabs or pills */}
      <div className="hidden md:block">
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
                        'absolute left-0 right-0 -bottom-px h-0.5 rounded-full transition-opacity',
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

      {/* Mobile bar: show current tab + open menu button */}
      <div className="md:hidden print:hidden">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-3 py-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-xs text-[hsl(var(--muted-fg))]">Section</div>
            <div className="text-sm font-medium text-[hsl(var(--fg))] truncate">
              {activeItem ? activeItem.label : items[0]?.label}
            </div>
          </div>

          <button
            type="button"
            aria-label="Open section menu"
            onClick={() => setOpen(true)}
            className="inline-flex items-center justify-center rounded-md p-2 text-[hsl(var(--fg))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            {/* menu icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile modal with links */}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-start justify-center"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* panel */}
          <div className="relative mt-12 w-[min(92%,420px)] max-h-[80vh] overflow-auto rounded-2xl bg-[hsl(var(--surface))] shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-4 print:hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-[hsl(var(--fg))]">Sections</div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="p-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M6 6l12 12M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <nav>
              <ul className="flex flex-col gap-2">
                {items.map((item) => {
                  const active = isActivePath(currentPath, item.hrefString, item.exact);
                  return (
                    <li key={item.hrefString}>
                      <Link
                        href={item.hrefString}
                        onClick={() => setOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-(--radius) text-sm font-medium transition-colors',
                          active
                            ? 'bg-[hsl(var(--brand))] text-white'
                            : 'text-[hsl(var(--fg))] hover:bg-[hsl(var(--surface-2))]',
                        )}
                        aria-current={active ? 'page' : undefined}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
