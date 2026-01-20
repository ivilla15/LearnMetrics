// components/shell/ClassroomShell.tsx
import * as React from 'react';

import { AppShell, teacherNavItems, ClassroomSubNav } from '@/modules';
import { PageHeader, Section } from '@/components';

type ClassroomShellProps = {
  classroomId: number;
  classroomName: string;
  /** The current pathname for the subnav active state (ex: `/teacher/classrooms/12/people`) */
  currentPath: string;

  /** Optional buttons shown on the right side of the PageHeader */
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
    <AppShell
      navItems={teacherNavItems}
      // AppShell highlights EXACT matches, so keep this stable to highlight "Classrooms"
      currentPath="/teacher/classrooms"
      width="full"
    >
      <PageHeader
        title={classroomName?.trim() ? classroomName : `Classroom ${classroomId}`}
        subtitle="Manage this class."
        actions={actions}
      />

      {/* Sub-nav */}
      <Section tone="subtle">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
      </Section>

      {/* Page content */}
      <Section>{children}</Section>
    </AppShell>
  );
}
