import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch.app';
import { CalendarClient } from '@/modules';

export async function CalendarSection({ classroomId }: { classroomId: number }) {
  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(
    `${baseUrl}/api/teacher/classrooms/${classroomId}/assignments?status=all&limit=50`,
    { cache: 'no-store', headers: { cookie } },
  );

  if (!res.ok)
    return (
      <div className="p-6 text-sm text-[hsl(var(--danger))]">Failed to load calendar data</div>
    );

  const dto = await res.json();

  return <CalendarClient classroomId={classroomId} initial={dto} canManageAssignments={true} />;
}
