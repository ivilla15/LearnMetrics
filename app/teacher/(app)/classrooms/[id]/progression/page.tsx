import * as React from 'react';

import { requireTeacher, getOrCreateClassroomPolicy } from '@/core';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';

import { PageHeader, Section } from '@/components';
import { ClassroomSubNav } from '@/modules';
import { ProgressionClient } from '@/modules';

export default async function Page({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;

  const { id } = await params;

  let classroomId: number;
  try {
    const parsed = classroomIdParamSchema.parse({ id });
    classroomId = parsed.id;
  } catch {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }

  let policy: Awaited<ReturnType<typeof getOrCreateClassroomPolicy>>;
  try {
    policy = await getOrCreateClassroomPolicy({
      teacherId: auth.teacher.id,
      classroomId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load progression policy';
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{msg}</div>;
  }

  const title = `Progression`;
  const currentPath = `/teacher/classrooms/${classroomId}/progression`;

  return (
    <>
      <PageHeader title={title} subtitle="Configure operations, level range, and modifiers." />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />

        <ProgressionClient classroomId={classroomId} initialPolicy={policy} />
      </Section>
    </>
  );
}
