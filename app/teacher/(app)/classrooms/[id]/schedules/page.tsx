import { requireTeacher, getTeacherEntitlement } from '@/core';
import { ClassroomSubNav } from '@/modules';
import { PageHeader, Section } from '@/components';
import { SchedulesClient } from '@/modules/teacher/schedules';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch.app';

import type { ClassroomSchedulesResponse, ScheduleGate } from '@/types';

function buildScheduleGate(params: {
  plan: string | null | undefined;
  status: string | null | undefined;
  scheduleCount: number;
}): ScheduleGate {
  const plan = (params.plan ?? 'TRIAL').toUpperCase();
  const status = (params.status ?? 'ACTIVE').toUpperCase();

  if (status !== 'ACTIVE') {
    const canceled = status === 'CANCELED';
    return {
      ok: false,
      message: canceled
        ? 'Your subscription is canceled. Upgrade to re-enable scheduling.'
        : 'Your access is no longer active. Upgrade to re-enable scheduling.',
      upgradeUrl: canceled
        ? '/billing?reason=canceled&plan=pro'
        : '/billing?reason=expired&plan=pro',
    };
  }

  if (plan === 'TRIAL' && params.scheduleCount >= 1) {
    return {
      ok: false,
      message: 'Trial accounts can create 1 schedule per classroom. Upgrade to add more schedules.',
      upgradeUrl: '/billing?plan=pro',
    };
  }

  return { ok: true, message: '' };
}

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

  const ent = await getTeacherEntitlement(auth.teacher.id);
  const scheduleCount = initialSchedules.length;

  const gate = buildScheduleGate({
    plan: ent?.plan,
    status: ent?.status,
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
