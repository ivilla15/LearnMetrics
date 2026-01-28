// components/shell/ClassroomShell.tsx
import * as React from 'react';

import { AppShell, teacherNavItems, ClassroomSubNav } from '@/modules';
import { PageHeader, Section } from '@/components';

type ClassroomShellProps = {
  classroomId: number;
  classroomName: string;
  currentPath: string;

  actions?: React.ReactNode;

  children: React.ReactNode;
};

export function ClassroomShell({
  classroomId,
  classroomName,
  currentPath,
  actions,
  children,
}: ClassroomShellProps) {
  return (
    <AppShell navItems={teacherNavItems} currentPath="/teacher/classrooms" width="full">
      <PageHeader
        title={classroomName?.trim() ? classroomName : `Classroom ${classroomId}`}
        subtitle="Manage this class."
        actions={actions}
      />

      {/* Sub-nav */}
      <Section>
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
      </Section>

      {/* Page content */}
      <Section>{children}</Section>
    </AppShell>
  );
}
