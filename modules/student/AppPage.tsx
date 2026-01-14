'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { AppShell, studentNavItems } from '@/modules';
import { PageHeader, Section } from '@/components';

type AppPageProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;

  // ✅ allow full width
  width?: 'default' | 'wide' | 'full';

  actions?: React.ReactNode;

  // optional: background tone controls
  headerTone?: 'default' | 'subtle';
  contentTone?: 'none' | 'default' | 'subtle';

  // optional: spacing inside the content section
  contentClassName?: string;
};

export function AppPage({
  title,
  subtitle,
  children,
  width = 'full',
  actions,
  headerTone = 'default',
  contentTone = 'none',
  contentClassName,
}: AppPageProps) {
  const pathname = usePathname();

  return (
    <AppShell navItems={studentNavItems} currentPath={pathname} width={width}>
      <PageHeader title={title} subtitle={subtitle} actions={actions} tone={headerTone} />

      <Section tone={contentTone} className={contentClassName}>
        {children}
      </Section>
    </AppShell>
  );
}
