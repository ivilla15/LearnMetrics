'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib';
import { LearnMetricsLogo } from '../marketing/components/LearnMetricsLogo';

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  currentPath?: string;
  accountSlot?: React.ReactNode;
  topSlot?: React.ReactNode;
  width?: 'default' | 'wide' | 'full';
}

export function AppShell({
  children,
  navItems,
  currentPath = '',
  accountSlot,
  topSlot,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  // close on escape
  React.useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // prevent body scroll when menu open
  React.useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [menuOpen]);

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))]">
      {/* Topbar for mobile */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--border))] print:hidden md:hidden">
        <LearnMetricsLogo variant="icon-white" />

        <div className="flex items-center gap-2">
          {/* account slot can be shown collapsed on mobile if provided */}
          {accountSlot ? <div className="hidden sm:block">{accountSlot}</div> : null}

          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(true)}
            className="inline-flex items-center justify-center rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
          >
            {/* simple hamburger icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-48px)]">
        {/* Sidebar (desktop only) */}
        <aside className="hidden md:flex w-60 bg-[hsl(var(--surface))] shadow-[2px_0_24px_rgba(0,0,0,0.08)] flex-col z-10 print:hidden">
          <div
            className="
              h-25
              flex items-center
              px-6
              bg-[hsl(var(--brand))]
              text-white
              rounded-tr-(--radius)
              shadow-[0_1px_0_rgba(0,0,0,0.15)]
            "
          >
            <Link href="/" className="flex items-center">
              <LearnMetricsLogo variant="full-white" />
            </Link>
          </div>

          <nav className="flex-1 overflow-y-auto py-6 px-3">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentPath === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-(--radius) text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-[hsl(var(--brand))] text-white'
                          : 'text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))]',
                      )}
                    >
                      {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {accountSlot ? (
            <div className="p-4 border-t border-[hsl(var(--border))]">{accountSlot}</div>
          ) : null}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-[hsl(var(--bg))]">
          <div className="w-full">
            {topSlot ? <div className="w-full">{topSlot}</div> : null}
            {children}
          </div>
        </main>
      </div>

      {/* Mobile menu modal */}
      {menuOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
          className="fixed inset-0 z-50 flex items-start justify-center"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />

          {/* panel */}
          <div className="relative mt-12 w-[min(92%,420px)] max-h-[80vh] overflow-auto rounded-2xl bg-[hsl(var(--surface))] shadow-[0_10px_40px_rgba(0,0,0,0.25)] p-4 print:hidden">
            <div className="flex items-center justify-between mb-3">
              <Link href="/" className="flex items-center">
                <span className="text-[17px] font-semibold tracking-[-0.01em] text-[hsl(var(--fg))]">
                  LearnMetrics
                </span>
              </Link>

              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
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
                {navItems.map((item) => {
                  const isActive = currentPath === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-(--radius) text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-[hsl(var(--brand))] text-white'
                            : 'text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))]',
                        )}
                      >
                        {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {accountSlot ? (
              <div className="mt-4 border-t border-[hsl(var(--border))] pt-3">{accountSlot}</div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
