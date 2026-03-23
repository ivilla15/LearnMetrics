import * as React from 'react';
import { Suspense } from 'react';
import { requireTeacher } from '@/core/auth';
import { ClassroomShell, ProgressSectionSkeleton } from '@/modules';
import { ClassroomProgressSection } from '@/modules/teacher/progress/ProgressSection';

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

  const currentPath = `/teacher/classrooms/${classroomId}/progress`;

  return (
    <ClassroomShell classroomId={classroomId} teacherId={auth.teacher.id} currentPath={currentPath}>
      <Suspense fallback={<ProgressSectionSkeleton />}>
        <ClassroomProgressSection teacherId={auth.teacher.id} classroomId={classroomId} days={30} />
      </Suspense>
    </ClassroomShell>
  );
}
