'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AppShell, teacherNavItems } from '@/modules';

export function TeacherClassroomsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';

  return (
    <AppShell navItems={teacherNavItems} currentPath={pathname} width="full">
      {children}
    </AppShell>
  );
}
