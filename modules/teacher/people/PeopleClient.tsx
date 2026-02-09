'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components';
import { RosterTableCard } from '@/modules/teacher/people';

import type { BulkAddResponse, RosterStudentRow } from '@/types';
import type { NewStudentInput } from '@/utils/students';
import { SetupCodeRow } from '@/types/classroom';

type Props = {
  classroomId: number;
  initialStudents: RosterStudentRow[];
};

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

export function PeopleClient({ classroomId, initialStudents }: Props) {
  const toast = useToast();
  const router = useRouter();

  const [students, setStudents] = React.useState<RosterStudentRow[]>(initialStudents);
  const [busy, setBusy] = React.useState(false);

  async function refreshRoster() {
    const res = await fetch(`/api/classrooms/${classroomId}/roster`, {
      credentials: 'include',
      cache: 'no-store',
    });

    const dataUnknown: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        typeof (dataUnknown as { error?: unknown } | null)?.error === 'string'
          ? (dataUnknown as { error: string }).error
          : 'Failed to load roster';
      throw new Error(msg);
    }

    const studentsArr = (dataUnknown as { students?: unknown } | null)?.students;
    if (Array.isArray(studentsArr)) {
      setStudents(studentsArr as RosterStudentRow[]);
    } else {
      setStudents([]);
    }
  }

  async function bulkAddStudents(newStudents: NewStudentInput[]): Promise<BulkAddResponse> {
    const res = await fetch(`/api/classrooms/${classroomId}/students/bulk`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: newStudents }),
    });

    const dataUnknown: unknown = await res.json().catch(() => null);

    if (!res.ok) {
      const msg =
        typeof (dataUnknown as { error?: unknown } | null)?.error === 'string'
          ? (dataUnknown as { error: string }).error
          : 'Failed to add students';
      throw new Error(msg);
    }

    const studentsArr = (dataUnknown as { students?: unknown } | null)?.students;
    if (Array.isArray(studentsArr)) {
      setStudents(studentsArr as RosterStudentRow[]);
    } else {
      await refreshRoster();
    }

    const setupCodesUnknown = (dataUnknown as { setupCodes?: unknown } | null)?.setupCodes;
    const setupCodes = Array.isArray(setupCodesUnknown)
      ? (setupCodesUnknown as SetupCodeRow[])
      : [];

    if (setupCodes.length > 0) {
      sessionStorage.setItem(
        `lm_setupCodes_${classroomId}`,
        JSON.stringify({ setupCodes, createdAt: new Date().toISOString() }),
      );
      router.push(`/teacher/classrooms/${classroomId}/print-cards`);
    }

    return { setupCodes };
  }

  async function updateStudent(
    id: number,
    input: { name: string; username: string; level: number },
  ) {
    setBusy(true);
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/students/${id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const dataUnknown: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          typeof (dataUnknown as { error?: unknown } | null)?.error === 'string'
            ? (dataUnknown as { error: string }).error
            : 'Failed to update student';
        throw new Error(msg);
      }

      await refreshRoster();
      toast('Student updated', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to update student'), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function deleteStudent(id: number) {
    setBusy(true);
    try {
      const res = await fetch(`/api/classrooms/${classroomId}/students/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!res.ok && res.status !== 204) {
        const dataUnknown: unknown = await res.json().catch(() => null);
        const msg =
          typeof (dataUnknown as { error?: unknown } | null)?.error === 'string'
            ? (dataUnknown as { error: string }).error
            : 'Failed to remove student';
        throw new Error(msg);
      }

      await refreshRoster();
      toast('Student removed', 'success');
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to remove student'), 'error');
    } finally {
      setBusy(false);
    }
  }

  async function resetStudentAccess(studentId: number): Promise<string> {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/students/${studentId}/reset-access`,
        { method: 'POST', credentials: 'include' },
      );

      const dataUnknown: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          typeof (dataUnknown as { error?: unknown } | null)?.error === 'string'
            ? (dataUnknown as { error: string }).error
            : 'Failed to reset access';
        throw new Error(msg);
      }

      const setupCode =
        typeof (dataUnknown as { setupCode?: unknown } | null)?.setupCode === 'string'
          ? ((dataUnknown as { setupCode: string }).setupCode as string)
          : null;

      const username =
        typeof (dataUnknown as { username?: unknown } | null)?.username === 'string'
          ? ((dataUnknown as { username: string }).username as string)
          : 'student';

      if (!setupCode) throw new Error('No setup code returned');

      sessionStorage.setItem(
        `lm_setupCodes_${classroomId}`,
        JSON.stringify({ setupCodes: [setupCode], createdAt: new Date().toISOString() }),
      );

      toast(`New setup code generated for ${username}`, 'success');
      router.push(`/teacher/classrooms/${classroomId}/print-cards`);

      return setupCode;
    } catch (err) {
      toast(getErrorMessage(err, 'Failed to reset access'), 'error');
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <RosterTableCard
      classroomId={classroomId}
      students={students}
      busy={busy}
      onBulkAdd={bulkAddStudents}
      onUpdateStudent={updateStudent}
      onDeleteStudent={deleteStudent}
      onResetAccess={resetStudentAccess}
      onGoProgress={(studentId) =>
        router.push(`/teacher/classrooms/${classroomId}/students/${studentId}/progress`)
      }
      onPrintCards={() => router.push(`/teacher/classrooms/${classroomId}/print-cards`)}
    />
  );
}
