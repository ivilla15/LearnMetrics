import { getBaseUrlFromHeaders, getCookieHeader } from '@/utils/serverFetch.app';
import { AssignmentDetailClient } from '@/modules';

export async function AssignmentDetailSection({
  classroomId,
  assignmentId,
}: {
  classroomId: number;
  assignmentId: number;
}) {
  const baseUrl = await getBaseUrlFromHeaders();
  const cookie = await getCookieHeader();

  const res = await fetch(
    `${baseUrl}/api/teacher/classrooms/${classroomId}/assignments/${assignmentId}/attempts?filter=ALL`,
    { cache: 'no-store', headers: { cookie } },
  );

  if (!res.ok) throw new Error('Failed to load assignment details');
  const dto = await res.json();

  return (
    <AssignmentDetailClient classroomId={classroomId} assignmentId={assignmentId} initial={dto} />
  );
}
