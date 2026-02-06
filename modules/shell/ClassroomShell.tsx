import * as React from 'react';

import { ClassroomSubNav } from '@/modules';
import { PageHeader, Section } from '@/components';

type ClassroomShellProps = {
  classroomId: number;
  classroomName: string;
  currentPath: string;

  topSlot?: React.ReactNode;
  actions?: React.ReactNode;

  children: React.ReactNode;
};

export function ClassroomShell({
  classroomId,
  classroomName,
  currentPath,
  actions,
  topSlot,
  children,
}: ClassroomShellProps) {
  return (
    <>
      {topSlot ? <div>{topSlot}</div> : null}

      <PageHeader
        title={classroomName?.trim() ? classroomName : `Classroom ${classroomId}`}
        subtitle="Manage this class."
        actions={actions}
      />

      <Section>
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
      </Section>

      <Section>{children}</Section>
    </>
  );
}
