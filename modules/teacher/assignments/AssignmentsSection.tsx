import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch.app';
import { AssignmentsClient } from '@/modules';

export async function AssignmentsSection({
  classroomId,
}: {
  classroomId: number;
  teacherId: number;
}) {
  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(
    `${baseUrl}/api/teacher/classrooms/${classroomId}/assignments?status=all&type=all&limit=20`,
    { cache: 'no-store', headers: { cookie } },
  );

  if (!res.ok) throw new Error('Failed to load assignments');
  const dto = await res.json();

  return <AssignmentsClient classroomId={classroomId} initial={dto} />;
}
