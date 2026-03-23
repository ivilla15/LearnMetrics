'use client';

import type { StudentMeDTO } from '@/types';

import {
  AppShell,
  studentNavItems,
  useStudentDashboard,
  DashboardHeader,
  StudentDashboardSkeleton,
  AssignmentsFeed,
} from '@/modules';

type Props = {
  currentPath: string;
};

type DashboardState = {
  loading: boolean;
  me: StudentMeDTO | null;
};

export default function StudentDashboardClient({ currentPath }: Props) {
  const { loading, me } = useStudentDashboard() as DashboardState;

  if (loading && !me) {
    return (
      <AppShell navItems={studentNavItems} currentPath={currentPath} width="full">
        <DashboardHeader loading={true} me={null} />
        <StudentDashboardSkeleton />
      </AppShell>
    );
  }

  if (!me) {
    return (
      <AppShell navItems={studentNavItems} currentPath={currentPath} width="full">
        <DashboardHeader loading={false} me={null} />
        <div className="p-6 text-[15px] text-[hsl(var(--muted-fg))]">Not signed in.</div>
      </AppShell>
    );
  }

  return (
    <AppShell navItems={studentNavItems} currentPath={currentPath} width="full">
      <DashboardHeader loading={false} me={me} />
      <div className="min-h-140">
        <AssignmentsFeed />
      </div>
    </AppShell>
  );
}
