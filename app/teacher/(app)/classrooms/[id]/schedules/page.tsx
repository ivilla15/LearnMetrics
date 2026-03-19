import { buildSchedulesGate, getTeacherEntitlementAccessState } from '@/core';
import { ClassroomSubNav } from '@/modules';
import { PageHeader, Section } from '@/components';
import { SchedulesClient } from '@/modules/teacher/schedules';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch.app';
import { requireTeacher } from '@/core/auth';

import type { ClassroomSchedulesResponse } from '@/types';

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

  const dto = (await res.json().catch(() => null)) as ClassroomSchedulesResponse | null;
  const initialSchedules = Array.isArray(dto?.schedules) ? dto.schedules : [];

  const currentPath = `/teacher/classrooms/${classroomId}/schedules`;

  const access = await getTeacherEntitlementAccessState(auth.teacher.id);
  const scheduleCount = initialSchedules.length;

  const gate = buildSchedulesGate({
    access,
    scheduleCount,
  });

  return (
    <>
      <PageHeader title="Schedules" subtitle="Manage weekly schedules for this classroom." />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
        <SchedulesClient classroomId={classroomId} initial={initialSchedules} gate={gate} />
      </Section>
    </>
  );
}
