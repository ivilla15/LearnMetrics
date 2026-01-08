"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface TeacherShellProps {
  children: React.ReactNode;
  navGroups: NavGroup[];
  currentPath?: string;
  accountSlot?: React.ReactNode;
}

export function TeacherShell({ children, navGroups, currentPath = "", accountSlot }: TeacherShellProps) {
  return (
    <div className="flex min-h-screen bg-[hsl(var(--bg))]">
      <aside className="w-64 border-r border-[hsl(var(--border))] bg-[hsl(var(--surface))] flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-[hsl(var(--border))]">
          <span className="text-lg font-semibold text-[hsl(var(--fg))]">LearnMetrics</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {navGroups.map((group) => (
            <div key={group.title} className="mb-6">
              <div className="px-3 mb-2">
                <h3 className="text-xs font-semibold text-[hsl(var(--muted-fg))] uppercase tracking-wider">
                  {group.title}
                </h3>
              </div>

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = currentPath === item.href;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-[var(--radius)] text-sm font-medium transition-colors",
                          isActive
                            ? "bg-[hsl(var(--brand))] text-[hsl(var(--brand-fg))]"
                            : "text-[hsl(var(--fg))] hover:bg-[hsl(var(--muted))]"
                        )}
                      >
                        {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {accountSlot ? (
          <div className="p-4 border-t border-[hsl(var(--border))]">{accountSlot}</div>
        ) : null}
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}