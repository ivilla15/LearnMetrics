'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { AppShell, studentNavItems } from '@/modules';
import { PageHeader, Section } from '@/components';

type AppPageProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;

  width?: 'default' | 'wide' | 'full';

  actions?: React.ReactNode;

  headerTone?: 'default' | 'subtle';
  contentTone?: 'none' | 'default' | 'subtle';

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
