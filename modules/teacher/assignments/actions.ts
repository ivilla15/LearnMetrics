import type {
  AssignmentStatusFilter,
  TeacherAssignmentsListResponse,
  AssignModalBootstrapResponse,
} from '@/types';
import { getApiErrorMessage, ApiErrorShape } from '@/utils';

export async function fetchAssignments(params: {
  classroomId: number;
  status: AssignmentStatusFilter;
  limit: number;
  cursor?: string | null;
}): Promise<TeacherAssignmentsListResponse> {
  const url = new URL(
    `/api/teacher/classrooms/${params.classroomId}/assignments`,
    window.location.origin,
  );
  url.searchParams.set('status', params.status);
  url.searchParams.set('limit', String(params.limit));
  if (params.cursor) url.searchParams.set('cursor', params.cursor);

  const res = await fetch(url.toString(), { cache: 'no-store', credentials: 'include' });
  const json = (await res.json().catch(() => null)) as TeacherAssignmentsListResponse | null;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(json, 'Failed to load assignments'));
  }

  if (!json) throw new Error('Failed to load assignments');
  return json;
}

export async function deleteAssignment(params: {
  classroomId: number;
  assignmentId: number;
}): Promise<void> {
  const res = await fetch(
    `/api/classrooms/${params.classroomId}/assignments/${params.assignmentId}`,
    { method: 'DELETE', credentials: 'include' },
  );

  if (res.status === 204) return;

  const json = await res.json().catch(() => null);
  const message =
    json && typeof json === 'object' && typeof (json as ApiErrorShape).error === 'string'
      ? String((json as ApiErrorShape).error)
      : 'Failed to delete assignment';

  throw new Error(message);
}

export async function fetchAssignModalBootstrap(params: {
  classroomId: number;
  days: number;
}): Promise<AssignModalBootstrapResponse> {
  const res = await fetch(
    `/api/teacher/classrooms/${params.classroomId}/progress?days=${params.days}`,
    { cache: 'no-store', credentials: 'include' },
  );

  const json = (await res.json().catch(() => null)) as AssignModalBootstrapResponse | null;

  if (!res.ok) {
    const msg =
      json && typeof json === 'object' && typeof (json as ApiErrorShape).error === 'string'
        ? String((json as ApiErrorShape).error)
        : 'Failed to load students';
    throw new Error(msg);
  }

  if (!json) throw new Error('Failed to load students');
  return json;
}
