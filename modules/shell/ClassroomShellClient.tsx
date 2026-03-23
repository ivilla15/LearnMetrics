'use client';

import * as React from 'react';
import { ClassroomSubNav } from '@/modules';
import { PageHeader, Section } from '@/components';

type Props = {
  classroomId: number;
  currentPath: string;
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function ClassroomShellClient({
  classroomId,
  currentPath,
  title,
  actions,
  children,
}: Props) {
  return (
    <>
      <PageHeader title={title} subtitle="Manage this class." actions={actions} />

      <Section pad="none" className="pt-8 pb-0">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
      </Section>

      <Section>{children}</Section>
    </>
  );
}
