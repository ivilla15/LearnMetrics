import * as React from 'react';
import { requireTeacher } from '@/core';

import { AppShell, teacherNavItems, ClassroomSubNav, ClassroomProgressClient } from '@/modules';
import { PageHeader, Section } from '@/components';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;

  const { id } = await params;
  const classroomId = Number(id);

  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }

  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(`${baseUrl}/api/teacher/classrooms/${classroomId}/progress?days=30`, {
    cache: 'no-store',
    headers: { cookie },
  });

  if (!res.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Failed to load progress</div>;
  }

  const dto = await res.json();

  const currentPath = `/teacher/classrooms/${classroomId}/progress`;

  return (
    <AppShell navItems={teacherNavItems} currentPath="/teacher/classrooms" width="full">
      <PageHeader
        title={`${dto.classroom.name}`}
        subtitle="Progress — class trends, at-risk flags, and the most missed facts."
      />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
        <ClassroomProgressClient classroomId={classroomId} initial={dto} />
      </Section>
    </AppShell>
  );
}
