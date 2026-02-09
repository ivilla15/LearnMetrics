'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components';

import type { TeacherAssignmentsListResponse } from '@/types';

import {
  AssignMakeupTestModal,
  AssignmentsTableCard,
  DeleteAssignmentModal,
  RecentAssignmentsSection,
  useAssignments,
  useAssignTest,
} from '@/modules';

export function AssignmentsClient({
  classroomId,
  initial,
}: {
  classroomId: number;
  initial: TeacherAssignmentsListResponse;
}) {
  const router = useRouter();
  const toast = useToast();

  const a = useAssignments(initial, classroomId);
  const assign = useAssignTest(classroomId);

  const [confirmDeleteId, setConfirmDeleteId] = React.useState<number | null>(null);

  return (
    <div className="space-y-6">
      <RecentAssignmentsSection
        classroomId={classroomId}
        rows={a.recent}
        onOpen={(assignmentId) =>
          router.push(`/teacher/classrooms/${classroomId}/assignments/${assignmentId}`)
        }
      />

      <AssignmentsTableCard
        classroomId={classroomId}
        status={a.status}
        search={a.search}
        setSearch={a.setSearch}
        onChangeStatus={a.onChangeStatus}
        rows={a.filteredRows}
        loading={a.loading}
        nextCursor={a.data.nextCursor}
        onLoadMore={a.loadMore}
        onOpenAssign={() => void assign.openModal()}
        onOpen={(assignmentId) =>
          router.push(`/teacher/classrooms/${classroomId}/assignments/${assignmentId}`)
        }
        onDelete={(assignmentId) => setConfirmDeleteId(assignmentId)}
      />

      {assign.open ? (
        <AssignMakeupTestModal
          open={assign.open}
          onClose={() => assign.setOpen(false)}
          classroomId={classroomId}
          students={assign.students}
          lastTestMeta={assign.lastMeta}
          defaultAudience="ALL"
        />
      ) : null}

      {assign.loading ? (
        <div className="text-xs text-[hsl(var(--muted-fg))]">Loading students…</div>
      ) : null}

      {assign.error ? (
        <div className="text-xs text-[hsl(var(--danger))]">{assign.error}</div>
      ) : null}

      <DeleteAssignmentModal
        open={confirmDeleteId !== null}
        assignmentId={confirmDeleteId}
        classroomId={classroomId}
        onClose={() => setConfirmDeleteId(null)}
        onDeleted={() => {
          toast('Assignment deleted', 'success');
          setConfirmDeleteId(null);
          router.refresh();
        }}
      />
    </div>
  );
}
