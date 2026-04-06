import * as React from 'react';
import { Suspense } from 'react';
import { requireTeacher } from '@/core/auth/requireTeacher';
import { ClassroomShell } from '@/modules';
import { ClassroomDashboardSkeleton } from '@/modules';
import { ClassroomOverviewSection } from '@/modules/teacher/dashboard/ClassroomOverviewSection';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();

  if (!auth.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;
  }

  const { id } = await params;
  const classroomId = Number(id);
  const currentPath = `/teacher/classrooms/${classroomId}`;

  return (
    <ClassroomShell classroomId={classroomId} teacherId={auth.teacher.id} currentPath={currentPath}>
      <Suspense fallback={<ClassroomDashboardSkeleton />}>
        <ClassroomOverviewSection classroomId={classroomId} teacherId={auth.teacher.id} />
      </Suspense>
    </ClassroomShell>
  );
}
