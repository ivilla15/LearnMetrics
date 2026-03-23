import { PageHeader } from '@/components';
import { AppShell, teacherNavItems } from '@/modules';
import { SettingsSkeleton } from '@/modules';

export default function Loading() {
  return (
    <AppShell navItems={teacherNavItems} currentPath="/teacher/settings" width="full">
      <PageHeader title="Settings" subtitle="Manage billing and security" />
      <SettingsSkeleton />
    </AppShell>
  );
}
