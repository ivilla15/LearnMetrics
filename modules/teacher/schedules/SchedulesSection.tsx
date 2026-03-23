import { buildSchedulesGate, getTeacherEntitlementAccessState } from '@/core';
import { SchedulesClient } from '@/modules/teacher/schedules';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch.app';
import type { ClassroomSchedulesResponse } from '@/types';

export async function SchedulesSection({
  classroomId,
  teacherId,
}: {
  classroomId: number;
  teacherId: number;
}) {
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

  // This will now stop complaining because teacherId is a string
  const access = await getTeacherEntitlementAccessState(teacherId);

  const gate = buildSchedulesGate({
    access,
    scheduleCount: initialSchedules.length,
  });

  return <SchedulesClient classroomId={classroomId} initial={initialSchedules} gate={gate} />;
}
