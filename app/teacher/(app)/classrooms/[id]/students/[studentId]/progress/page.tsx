import * as React from 'react';
import { Suspense } from 'react';
import { requireTeacher } from '@/core';
import { ClassroomShell, StudentProgressSkeleton } from '@/modules';
import { StudentProgressSection } from '@/modules/teacher/student-progress/StudentProgressSection';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; studentId: string }>;
}) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6">{auth.error}</div>;

  const { id, studentId } = await params;
  const classroomId = Number(id);
  const sid = Number(studentId);
  const teacherId = Number(auth.teacher.id);

  const currentPath = `/teacher/classrooms/${classroomId}/students/${sid}/progress`;

  return (
    <ClassroomShell classroomId={classroomId} teacherId={teacherId} currentPath={currentPath}>
      <Suspense fallback={<StudentProgressSkeleton />}>
        <StudentProgressSection classroomId={classroomId} studentId={sid} teacherId={teacherId} />
      </Suspense>
    </ClassroomShell>
  );
}
