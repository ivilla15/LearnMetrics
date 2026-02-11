import * as React from 'react';

import { requireTeacher } from '@/core/auth/requireTeacher';

import { ClassroomSubNav, AssignmentsClient } from '@/modules';
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

  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(
    `${baseUrl}/api/teacher/classrooms/${classroomId}/assignments?status=finished&type=TEST&limit=20`,
    {
      cache: 'no-store',
      headers: { cookie },
    },
  );

  if (!res.ok) throw new Error('Failed to load assignments');
  const dto = await res.json();

  const currentPath = `/teacher/classrooms/${classroomId}/assignments`;

  return (
    <>
      <PageHeader
        title={dto?.classroom?.name ? `${dto.classroom.name}` : `Classroom ${classroomId}`}
        subtitle="Assignments — view past tests, open tests, and upcoming tests."
      />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
        <AssignmentsClient classroomId={classroomId} initial={dto} />
      </Section>
    </>
  );
}
