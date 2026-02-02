// app/teacher/classrooms/[id]/page.tsx
import * as React from 'react';

import { requireTeacher } from '@/core';
import { ClassroomShell, ClassroomStatsGrid } from '@/modules';
import { getTeacherClassroomOverview } from '@/core/classrooms';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;
  }

  const { id } = await params;
  const classroomId = Number(id);

  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }

  let overview: Awaited<ReturnType<typeof getTeacherClassroomOverview>>;

  try {
    overview = await getTeacherClassroomOverview({
      classroomId,
      teacherId: auth.teacher.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load classroom';
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{message}</div>;
  }

  const currentPath = `/teacher/classrooms/${classroomId}`;

  return (
    <ClassroomShell
      classroomId={classroomId}
      classroomName={overview.classroom.name}
      currentPath={currentPath}
    >
      <ClassroomStatsGrid stats={overview} />
    </ClassroomShell>
  );
}
