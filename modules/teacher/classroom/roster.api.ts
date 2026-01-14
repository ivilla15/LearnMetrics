import type { NewStudentInput } from '@/utils';
import type { StudentRow, SetupCodeRow } from './types';

function extractError(json: unknown, fallback: string) {
  if (!json || typeof json !== 'object') return fallback;
  const err = (json as { error?: unknown }).error;
  return typeof err === 'string' ? err : fallback;
}

export async function fetchRoster(classroomId: number): Promise<StudentRow[]> {
  const res = await fetch(`/api/classrooms/${classroomId}/roster`, {
    credentials: 'include',
  });
  const data = await res.json().catch(() => null);

  if (!res.ok) throw new Error(extractError(data, 'Failed to load roster'));

  // supports either { students } or array
  const students = Array.isArray(data?.students) ? data.students : Array.isArray(data) ? data : [];
  return students as StudentRow[];
}

export async function bulkAddStudentsApi(classroomId: number, students: NewStudentInput[]) {
  const res = await fetch(`/api/classrooms/${classroomId}/students/bulk`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ students }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractError(data, 'Failed to add students'));

  return {
    students: (data?.students ?? []) as StudentRow[],
    setupCodes: (data?.setupCodes ?? []) as SetupCodeRow[],
  };
}

export async function updateStudentApi(
  classroomId: number,
  studentId: number,
  input: { name: string; username: string; level: number },
): Promise<StudentRow> {
  const res = await fetch(`/api/classrooms/${classroomId}/students/${studentId}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractError(data, 'Failed to update student'));

  return data.student as StudentRow;
}

export async function deleteStudentApi(classroomId: number, studentId: number): Promise<void> {
  const res = await fetch(`/api/classrooms/${classroomId}/students/${studentId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!res.ok && res.status !== 204) {
    const data = await res.json().catch(() => null);
    throw new Error(extractError(data, `Failed to delete student ${studentId}`));
  }
}

export async function deleteManyStudentsApi(classroomId: number, studentIds: number[]) {
  // keep it simple + reuse existing endpoint
  for (const id of studentIds) {
    await deleteStudentApi(classroomId, id);
  }
}

export async function resetStudentAccessApi(
  classroomId: number,
  studentId: number,
): Promise<SetupCodeRow> {
  const res = await fetch(
    `/api/teacher/classrooms/${classroomId}/students/${studentId}/reset-access`,
    {
      method: 'POST',
      credentials: 'include',
    },
  );

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractError(data, 'Failed to reset access'));

  return data.setupCode as SetupCodeRow;
}
