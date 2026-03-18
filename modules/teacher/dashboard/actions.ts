import type { StudentAssignmentsListResponse } from '@/types';

export async function listStudentAssignments(params: {
  scope: 'today' | 'all';
  cursor: string | null;
  limit: number;
}): Promise<StudentAssignmentsListResponse> {
  const qs = new URLSearchParams();
  qs.set('scope', params.scope);
  qs.set('limit', String(params.limit));
  if (params.cursor) qs.set('cursor', params.cursor);

  const res = await fetch(`/api/student/assignments?${qs.toString()}`, {
    method: 'GET',
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error('Failed to load assignments.');
  }

  const json: unknown = await res.json();
  return json as StudentAssignmentsListResponse;
}
