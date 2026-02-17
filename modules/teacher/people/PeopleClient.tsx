'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components';
import { RosterTableCard } from '@/modules/teacher/people';

import type { BulkAddResponse, RosterStudentRow, BulkStudentInput } from '@/types';
import { SetupCodeRow } from '@/types/classroom';
import { getApiErrorMessage } from '@/utils';

type Props = {
  classroomId: number;
  initialStudents: RosterStudentRow[];
};

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

  async function bulkAddStudents(newStudents: BulkStudentInput[]): Promise<BulkAddResponse> {
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
      toast(getApiErrorMessage(err, 'Failed to update student'), 'error');
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
      toast(getApiErrorMessage(err, 'Failed to remove student'), 'error');
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

      // normalize response into SetupCodeRow
      const body = dataUnknown as Record<string, unknown> | null;

      // try the shape your API returns: { setupCode: SetupCodeRow }
      let row: SetupCodeRow | null = null;

      if (body?.setupCode && typeof body.setupCode === 'object') {
        row = body.setupCode as SetupCodeRow;
      } else if (Array.isArray(body?.setupCodes) && body.setupCodes.length > 0) {
        // fallback: { setupCodes: [SetupCodeRow, ...] }
        const first = (body.setupCodes as unknown[])[0];
        if (first && typeof first === 'object') row = first as SetupCodeRow;
      } else if (typeof body?.setupCode === 'string') {
        // fallback: { setupCode: "ABC123", username?: "joe" }
        const username = typeof body?.username === 'string' ? (body.username as string) : 'student';
        row = {
          studentId,
          username,
          setupCode: body.setupCode as string,
          expiresAt: typeof body?.expiresAt === 'string' ? (body.expiresAt as string) : undefined,
          name: typeof body?.name === 'string' ? (body.name as string) : undefined,
        };
      }

      if (!row || typeof row.setupCode !== 'string') {
        throw new Error('No setup code returned');
      }

      sessionStorage.setItem(
        `lm_setupCodes_${classroomId}`,
        JSON.stringify({ setupCodes: [row], createdAt: new Date().toISOString() }),
      );

      toast(`New setup code generated for ${row.username}`, 'success');
      router.push(`/teacher/classrooms/${classroomId}/print-cards`);

      return row.setupCode;
    } catch (err) {
      toast(getApiErrorMessage(err, 'Failed to reset access'), 'error');
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
