import * as React from 'react';
import { Suspense } from 'react';
import { requireTeacher } from '@/core/auth/requireTeacher';
import { AssignmentDetailSkeleton, ClassroomShell } from '@/modules';
import { AssignmentDetailSection } from '@/modules/teacher/assignments/detail/AssignmentDetailSection';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string; assignmentId: string }>;
}) {
  const auth = await requireTeacher();
  if (!auth.ok) return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;

  const { id, assignmentId } = await params;
  const classroomId = Number(id);
  const aid = Number(assignmentId);
  const currentPath = `/teacher/classrooms/${classroomId}/assignments`;

  return (
    <ClassroomShell classroomId={classroomId} teacherId={auth.teacher.id} currentPath={currentPath}>
      <Suspense fallback={<AssignmentDetailSkeleton />}>
        <AssignmentDetailSection classroomId={classroomId} assignmentId={aid} />
      </Suspense>
    </ClassroomShell>
  );
}
