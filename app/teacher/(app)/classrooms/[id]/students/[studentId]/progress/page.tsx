import * as React from 'react';

import { requireTeacher } from '@/core';

import { ClassroomSubNav } from '@/modules';

import { PageHeader, Section } from '@/components';
import { getTeacherStudentProgress } from '@/core/teacher/Progress/studentService';
import { StudentProgressClient } from '@/modules/teacher/student-progress';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;

  const { id, studentId } = await params;

  const classroomId = Number(id);
  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }

  const sid = Number(studentId);
  if (!Number.isFinite(sid) || sid <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid student id</div>;
  }

  let dto: Awaited<ReturnType<typeof getTeacherStudentProgress>>;
  try {
    dto = await getTeacherStudentProgress({
      teacherId: auth.teacher.id,
      classroomId,
      studentId: sid,
      days: 30,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to load student progress';
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{msg}</div>;
  }

  const currentPath = `/teacher/classrooms/${classroomId}/students/${sid}/progress`;

  return (
    <>
      <PageHeader
        title={`${dto.student.name}`}
        subtitle={`@${dto.student.username} — Progress report`}
      />

      <Section className="space-y-4">
        <div className="lm-no-print">
          <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />
        </div>

        <StudentProgressClient classroomId={classroomId} studentId={sid} initial={dto} />
      </Section>
    </>
  );
}
