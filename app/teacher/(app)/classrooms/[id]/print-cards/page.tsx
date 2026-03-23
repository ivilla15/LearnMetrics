import * as React from 'react';
import { Suspense } from 'react';
import { requireTeacher } from '@/core/auth';
import { ClassroomShell, PrintCardsSkeleton } from '@/modules';
import PrintCardsClient from './PrintCardsClient';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6">{auth.error}</div>;

  const { id } = await params;
  const classroomId = Number(id);
  const teacherId = Number(auth.teacher.id);
  const currentPath = `/teacher/classrooms/${classroomId}/print-cards`;

  return (
    <ClassroomShell classroomId={classroomId} teacherId={teacherId} currentPath={currentPath}>
      <Suspense fallback={<PrintCardsSkeleton />}>
        <PrintCardsClient classroomId={classroomId} />
      </Suspense>
    </ClassroomShell>
  );
}
