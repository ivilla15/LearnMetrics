import { AssignmentAttemptDetail, AssignmentAttemptRow } from '@/types';

function extractError(json: unknown, fallback: string) {
  if (!json || typeof json !== 'object') return fallback;
  const err = (json as { error?: unknown }).error;
  return typeof err === 'string' ? err : fallback;
}

export async function fetchClassroomAssignments(classroomId: number, params?: { days?: number }) {
  const qs = params?.days ? `?days=${params.days}` : '';
  const res = await fetch(`/api/teacher/classrooms/${classroomId}/assignments${qs}`, {
    credentials: 'include',
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractError(data, 'Failed to load assignments'));

  const rows = Array.isArray(data?.rows) ? data.rows : Array.isArray(data) ? data : [];
  return rows;
}

export async function fetchAssignmentAttempts(
  classroomId: number,
  assignmentId: number,
  params?: { cursor?: string | null; filter?: 'ALL' | 'MASTERY' | 'NOT_MASTERY' },
): Promise<{ rows: AssignmentAttemptRow[]; nextCursor: string | null }> {
  const sp = new URLSearchParams();
  sp.set('filter', (params?.filter ?? 'ALL').toUpperCase());
  if (params?.cursor) sp.set('cursor', params.cursor);

  const res = await fetch(
    `/api/teacher/classrooms/${classroomId}/assignments/${assignmentId}/attempts?${sp.toString()}`,
    { credentials: 'include' },
  );

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractError(data, 'Failed to load assignment attempts'));

  return {
    rows: (Array.isArray(data?.rows) ? data.rows : []) as AssignmentAttemptRow[],
    nextCursor: typeof data?.nextCursor === 'string' ? data.nextCursor : null,
  };
}

export async function fetchAssignmentAttemptDetail(
  classroomId: number,
  assignmentId: number,
  attemptId: number,
): Promise<AssignmentAttemptDetail> {
  const res = await fetch(
    `/api/teacher/classrooms/${classroomId}/assignments/${assignmentId}/attempts/${attemptId}`,
    { credentials: 'include' },
  );

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractError(data, 'Failed to load attempt details'));

  return data as AssignmentAttemptDetail;
}
