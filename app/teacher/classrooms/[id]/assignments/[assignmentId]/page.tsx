import * as React from 'react';

import { requireTeacher } from '@/core/auth/requireTeacher';

import { AppShell, teacherNavItems, ClassroomSubNav, AssignmentDetailClient } from '@/modules';
import { PageHeader, Section } from '@/components';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;

  const { id, assignmentId } = await params;
  const classroomId = Number(id);
  const aid = Number(assignmentId);

  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }
  if (!Number.isFinite(aid) || aid <= 0) {
    return (
      <div
        className="
    p-6 text-sm text-[hsl(var(--danger))]"
      >
        Invalid assignment id
      </div>
    );
  }

  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(
    `${baseUrl}/api/teacher/classrooms/${classroomId}/assignments/${aid}/attempts?filter=ALL`,
    {
      cache: 'no-store',
      headers: { cookie },
    },
  );

  if (!res.ok) throw new Error('Failed to load assignment attempts');
  const dto = await res.json();

  const currentPath = `/teacher/classrooms/${classroomId}/assignments`;

  return (
    <AppShell navItems={teacherNavItems} currentPath="/teacher/classrooms" width="full">
      <PageHeader
        title={`Assignment ${aid}`}
        subtitle="Assignment details — who attempted, who mastered, and who is missing."
      />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
        <AssignmentDetailClient classroomId={classroomId} assignmentId={aid} initial={dto} />
      </Section>
    </AppShell>
  );
}
