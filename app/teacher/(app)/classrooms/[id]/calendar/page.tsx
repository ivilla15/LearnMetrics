import * as React from 'react';
import { requireTeacher } from '@/core';

import { ClassroomSubNav, CalendarClient } from '@/modules';
import { PageHeader, Section } from '@/components';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;

  const { id } = await params;
  const classroomId = Number(id);

  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }

  // initial fetch (first page). Client will paginate if needed.
  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(
    `${baseUrl}/api/teacher/classrooms/${classroomId}/assignments?status=all&limit=50`,
    { cache: 'no-store', headers: { cookie } },
  );

  if (!res.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Failed to load assignments</div>;
  }

  const dto = await res.json();

  const currentPath = `/teacher/classrooms/${classroomId}/calendar`;

  return (
    <>
      <PageHeader title="Calendar" subtitle="Plan and manage assignments by date." />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
        <CalendarClient classroomId={classroomId} initial={dto} />
      </Section>
    </>
  );
}
