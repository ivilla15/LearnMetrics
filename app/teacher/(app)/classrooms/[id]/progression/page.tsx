import * as React from 'react';

import { requireTeacher } from '@/core';
import { ClassroomShell, ProgressionSkeleton } from '@/modules';
import { Suspense } from 'react';
import { ProgressionSection } from '@/modules/teacher/progression/ProgressionSection';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6">{auth.error}</div>;

  const { id } = await params;
  const classroomId = Number(id);
  const currentPath = `/teacher/classrooms/${classroomId}/progression`;

  return (
    <ClassroomShell classroomId={classroomId} teacherId={auth.teacher.id} currentPath={currentPath}>
      <Suspense fallback={<ProgressionSkeleton />}>
        <ProgressionSection classroomId={classroomId} />
      </Suspense>
    </ClassroomShell>
  );
}
