import * as React from 'react';

import { requireTeacher, getRosterWithLastAttempt } from '@/core';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';

import { PageHeader, Section } from '@/components';
import { ClassroomSubNav, PeopleClient } from '@/modules';

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

  let roster: Awaited<ReturnType<typeof getRosterWithLastAttempt>>;
  try {
    roster = await getRosterWithLastAttempt({
      classroomId,
      teacherId: auth.teacher.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load roster';
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{msg}</div>;
  }

  const title = roster.classroom?.name?.trim() ? roster.classroom.name : `Classroom ${classroomId}`;

  const currentPath = `/teacher/classrooms/${classroomId}/people`;

  return (
    <>
      <PageHeader title={title} subtitle="People — manage your roster and student access." />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />

        <PeopleClient classroomId={classroomId} initialStudents={roster.students} />
      </Section>
    </>
  );
}
