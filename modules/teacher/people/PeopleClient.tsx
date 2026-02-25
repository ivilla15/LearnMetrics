'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { useToast } from '@/components';
import { RosterTableCard } from '@/modules/teacher/people';

import type { BulkAddResponseDTO, RosterStudentRowDTO, BulkAddStudentInputDTO } from '@/types';
import type { OperationCode } from '@/types/enums';
import type { SetupCodeCardDTO } from '@/types';

import { getApiErrorMessage } from '@/utils';

type Props = {
  classroomId: number;
  initialStudents: RosterStudentRowDTO[];

  enabledOperations: OperationCode[];
  primaryOperation: OperationCode;
};

export function PeopleClient({
  classroomId,
  initialStudents,
  enabledOperations,
  primaryOperation,
}: Props) {
  const toast = useToast();
  const router = useRouter();

  const [students, setStudents] = React.useState<RosterStudentRowDTO[]>(initialStudents);
  const [busy, setBusy] = React.useState(false);

  async function refreshRoster(): Promise<RosterStudentRowDTO[]> {
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
    const next = Array.isArray(studentsArr) ? (studentsArr as RosterStudentRowDTO[]) : [];
    setStudents(next);
    return next;
  }

  async function bulkAddStudents(
    newStudents: BulkAddStudentInputDTO[],
  ): Promise<BulkAddResponseDTO> {
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

    let nextStudents: RosterStudentRowDTO[] = [];

    if (Array.isArray(studentsArr)) {
      nextStudents = studentsArr as RosterStudentRowDTO[];
      setStudents(nextStudents);
    } else {
      nextStudents = await refreshRoster();
    }

    const setupCodesUnknown = (dataUnknown as { setupCodes?: unknown } | null)?.setupCodes;
    const setupCodes = Array.isArray(setupCodesUnknown)
      ? (setupCodesUnknown as SetupCodeCardDTO[])
      : [];

    if (setupCodes.length > 0) {
      sessionStorage.setItem(
        `lm_setupCodes_${classroomId}`,
        JSON.stringify({ setupCodes, createdAt: new Date().toISOString() }),
      );
      router.push(`/teacher/classrooms/${classroomId}/print-cards`);
    }

    return { setupCodes, students: nextStudents };
  }

  async function updateStudent(id: number, input: { name: string; username: string }) {
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
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function updateStudentProgress(params: {
    studentId: number;
    operation: OperationCode;
    level: number;
  }) {
    const { studentId, operation, level } = params;

    setBusy(true);
    try {
      const res = await fetch(
        `/api/teacher/classrooms/${classroomId}/students/${studentId}/progress`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ levels: [{ operation, level }] }),
        },
      );

      const dataUnknown: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          typeof (dataUnknown as { error?: unknown } | null)?.error === 'string'
            ? (dataUnknown as { error: string }).error
            : 'Failed to update progress';
        throw new Error(msg);
      }

      await refreshRoster();
    } catch (err) {
      toast(getApiErrorMessage(err, 'Failed to update progress'), 'error');
      throw err;
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

      const body = dataUnknown as Record<string, unknown> | null;

      const setupCodeObj =
        body && typeof body === 'object' && body.setupCode && typeof body.setupCode === 'object'
          ? (body.setupCode as SetupCodeCardDTO)
          : null;

      if (!setupCodeObj || typeof setupCodeObj.setupCode !== 'string') {
        throw new Error('No setup code returned');
      }

      sessionStorage.setItem(
        `lm_setupCodes_${classroomId}`,
        JSON.stringify({ setupCodes: [setupCodeObj], createdAt: new Date().toISOString() }),
      );

      toast(`New setup code generated for ${setupCodeObj.username}`, 'success');
      router.push(`/teacher/classrooms/${classroomId}/print-cards`);

      return setupCodeObj.setupCode;
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
      enabledOperations={enabledOperations}
      primaryOperation={primaryOperation}
      onBulkAdd={bulkAddStudents}
      onUpdateStudent={updateStudent}
      onUpdateStudentProgress={updateStudentProgress}
      onDeleteStudent={deleteStudent}
      onResetAccess={resetStudentAccess}
      onGoProgress={(studentId) =>
        router.push(`/teacher/classrooms/${classroomId}/students/${studentId}/progress`)
      }
      onPrintCards={() => router.push(`/teacher/classrooms/${classroomId}/print-cards`)}
    />
  );
}
