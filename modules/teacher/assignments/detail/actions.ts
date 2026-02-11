import type { AssignmentAttemptsFilter, TeacherAssignmentAttemptsResponse } from '@/types';
import { getApiErrorMessage } from '@/utils';

export async function fetchAssignmentAttempts(params: {
  classroomId: number;
  assignmentId: number;
  filter: AssignmentAttemptsFilter;
}): Promise<TeacherAssignmentAttemptsResponse> {
  const res = await fetch(
    `/api/teacher/classrooms/${params.classroomId}/assignments/${params.assignmentId}/attempts?filter=${params.filter}`,
    { cache: 'no-store', credentials: 'include' },
  );

  const json = (await res.json().catch(() => null)) as TeacherAssignmentAttemptsResponse | null;

  if (!res.ok) {
    throw new Error(getApiErrorMessage(json, 'Failed to load assignment attempts'));
  }

  if (!json) throw new Error('Failed to load assignment attempts');
  return json;
}

export async function fetchAttemptDetail(params: {
  classroomId: number;
  studentId: number;
  attemptId: number;
}): Promise<unknown> {
  const res = await fetch(
    `/api/teacher/classrooms/${params.classroomId}/students/${params.studentId}/attempts/${params.attemptId}`,
    { cache: 'no-store', credentials: 'include' },
  );

  const json = (await res.json().catch(() => null)) as unknown;

  if (!res.ok) {
    const msg =
      json && typeof (json as { error?: unknown }).error === 'string'
        ? String((json as { error?: unknown }).error)
        : 'Failed to load attempt details';
    throw new Error(msg);
  }

  return json;
}
