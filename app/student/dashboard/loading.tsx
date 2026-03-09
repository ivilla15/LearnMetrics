import * as React from 'react';

import { AppShell, studentNavItems } from '@/modules';
import { StudentDashboardSkeleton } from '@/modules';

export default function Loading() {
  return (
    <AppShell navItems={studentNavItems} currentPath="/student/dashboard" width="full">
      <StudentDashboardSkeleton />
    </AppShell>
  );
}
