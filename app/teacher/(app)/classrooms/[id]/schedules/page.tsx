import * as React from 'react';
import { requireTeacher } from '@/core/auth/requireTeacher';
import { AppShell, teacherNavItems, ClassroomSubNav } from '@/modules';
import { PageHeader, Section } from '@/components';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils';
import { SchedulesClient } from '@/modules';

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

  const res = await fetch(`${baseUrl}/api/classrooms/${classroomId}/schedules`, {
    cache: 'no-store',
    headers: { cookie },
  });

  if (!res.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Failed to load schedules</div>;
  }

  const dto = await res.json();
  const initialSchedules = Array.isArray(dto?.schedules) ? dto.schedules : [];

  const currentPath = `/teacher/classrooms/${classroomId}/schedules`;

  return (
    <AppShell navItems={teacherNavItems} currentPath="/teacher/classrooms" width="full">
      <PageHeader title="Schedules" subtitle="Manage weekly test schedules for this classroom." />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
        <SchedulesClient classroomId={classroomId} initial={initialSchedules} />
      </Section>
    </AppShell>
  );
}
