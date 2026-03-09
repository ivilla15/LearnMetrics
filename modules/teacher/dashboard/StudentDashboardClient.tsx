'use client';

import type { StudentMeDTO } from '@/types';

import {
  AppShell,
  studentNavItems,
  useStudentDashboard,
  DashboardHeader,
  DashboardSkeleton,
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

  return (
    <AppShell navItems={studentNavItems} currentPath={currentPath} width="full">
      <DashboardHeader loading={loading} me={me} />

      {loading ? (
        <DashboardSkeleton />
      ) : !me ? (
        <div className="p-6 text-[15px] text-[hsl(var(--muted-fg))]">Not signed in.</div>
      ) : (
        <AssignmentsFeed />
      )}
    </AppShell>
  );
}
