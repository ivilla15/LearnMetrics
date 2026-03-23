import * as React from 'react';
import { Suspense } from 'react';
import { requireTeacher } from '@/core/auth';
import { ClassroomShell, PeopleSkeleton } from '@/modules';
import { PeopleSection } from '@/modules/teacher/people/PeopleSection';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;

  const { id } = await params;
  const classroomId = Number(id);
  const currentPath = `/teacher/classrooms/${classroomId}/people`;

  return (
    <ClassroomShell classroomId={classroomId} teacherId={auth.teacher.id} currentPath={currentPath}>
      <Suspense fallback={<PeopleSkeleton />}>
        <PeopleSection classroomId={classroomId} teacherId={auth.teacher.id} />
      </Suspense>
    </ClassroomShell>
  );
}
