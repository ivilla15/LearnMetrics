'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';

import { StudentShell } from '@/components/shell/StudentShell';
import { PageHeader } from '@/components/ui/page-header';

type StudentPageProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  width?: 'default' | 'wide';
  actions?: React.ReactNode;
};

export function StudentPage({
  title,
  subtitle,
  children,
  width = 'default',
  actions,
}: StudentPageProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/student/dashboard' },
    { label: 'Progress', href: '/student/progress' },
    // keep logout in nav for now; later we can move it to accountSlot
    { label: 'Logout', href: '/student/logout' },
  ];

  return (
    <StudentShell navItems={navItems} currentPath={pathname} width={width}>
      <PageHeader title={title} subtitle={subtitle} actions={actions} />
      {children}
    </StudentShell>
  );
}
