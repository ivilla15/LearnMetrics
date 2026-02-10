'use client';

import { usePathname } from 'next/navigation';

import { AppShell, studentNavItems } from '@/modules';
import { Section, PageHeader } from '@/components';
import { AttemptExplorer } from '@/modules/teacher/student-progress';

export default function StudentProgressPage() {
  const pathname = usePathname();

  return (
    <AppShell navItems={studentNavItems} currentPath={pathname} width="wide">
      <PageHeader
        title="Progress"
        subtitle="Review your past tests and see how your level changes over time."
      />

      <Section className="space-y-6">
        <AttemptExplorer baseUrl="/api/student" />
      </Section>
    </AppShell>
  );
}
