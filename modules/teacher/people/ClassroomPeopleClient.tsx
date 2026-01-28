'use client';

import { Card, useToast } from '@/components';

import { RosterTable } from '@/modules/teacher/people';
import type { StudentRow } from '@/modules/teacher/classroom';
import type { NewStudentInput } from '@/utils/students';
import { useRouter } from 'next/navigation';
import React from 'react';

type Props = {
  classroomId: number;
  initialStudents: StudentRow[];
};

export function PeopleClient({ classroomId, initialStudents }: Props) {
  const toast = useToast();
  const router = useRouter();

  const [students, setStudents] = React.useState<StudentRow[]>(initialStudents);
  const [busy, setBusy] = React.useState(false);

  async function refreshRoster() {
    const res = await fetch(`/api/classrooms/${classroomId}/roster`, {
      credentials: 'include',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to load roster');
    }

    setStudents(Array.isArray(data?.students) ? data.students : []);
  }

  async function bulkAddStudents(newStudents: NewStudentInput[]) {
    const res = await fetch(`/api/classrooms/${classroomId}/students/bulk`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ students: newStudents }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to add students');
    }

    setStudents(data.students ?? []);

    if (Array.isArray(data?.setupCodes) && data.setupCodes.length > 0) {
      sessionStorage.setItem(
        `lm_setupCodes_${classroomId}`,
        JSON.stringify({
          setupCodes: data.setupCodes,
          createdAt: new Date().toISOString(),
        }),
      );

      router.push(`/teacher/classrooms/${classroomId}/print-cards`);
    }

    return { setupCodes: data.setupCodes ?? [] };
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

      if (!res.ok) throw new Error('Failed to update student');
      await refreshRoster();
      toast('Student updated', 'success');
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
        throw new Error('Failed to remove student');
      }

      await refreshRoster();
      toast('Student removed', 'success');
    } finally {
      setBusy(false);
    }
  }

  async function resetStudentAccess(studentId: number) {
    const res = await fetch(
      `/api/teacher/classrooms/${classroomId}/students/${studentId}/reset-access`,
      {
        method: 'POST',
        credentials: 'include',
      },
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to reset access');
    }

    sessionStorage.setItem(
      `lm_setupCodes_${classroomId}`,
      JSON.stringify({
        setupCodes: [data.setupCode],
        createdAt: new Date().toISOString(),
      }),
    );

    router.push(`/teacher/classrooms/${classroomId}/print-cards`);
    return data.setupCode;
  }

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <RosterTable
        classroomId={classroomId}
        students={students}
        busy={busy}
        onBulkAdd={bulkAddStudents}
        onUpdateStudent={updateStudent}
        onDeleteStudent={deleteStudent}
        onResetAccess={resetStudentAccess}
      />
    </Card>
  );
}
