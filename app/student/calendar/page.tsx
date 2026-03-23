import * as React from 'react';
import { requireStudent } from '@/core/auth';
import { CalendarClient } from '@/modules/teacher/calendar/CalendarClient';
import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch.app';
import { AppPage } from '@/modules';

export default async function Page() {
  const auth = await requireStudent();
  if (!auth.ok) return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;

  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(`${baseUrl}/api/student/calendar?status=all&limit=50`, {
    cache: 'no-store',
    headers: { cookie },
  });

  if (!res.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Failed to load calendar</div>;
  }

  const dto = await res.json();

  return (
    <AppPage title="Calendar" subtitle="Your scheduled assignments & upcoming tests." width="wide">
      <CalendarClient classroomId={dto.classroom.id} initial={dto} canManageAssignments={false} />
    </AppPage>
  );
}
