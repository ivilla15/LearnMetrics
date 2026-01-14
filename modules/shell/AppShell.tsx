'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib';

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
  width?: 'default' | 'wide' | 'full';
}

export function AppShell({ children, navItems, currentPath = '', accountSlot }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[hsl(var(--bg))]">
      {/* Sidebar */}
      <aside className="w-60 bg-[hsl(var(--surface))] shadow-[2px_0_24px_rgba(0,0,0,0.08)] flex flex-col z-10">
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
            <span className="text-[17px] font-semibold tracking-[-0.01em] text-white">
              LearnMetrics
            </span>
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
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
