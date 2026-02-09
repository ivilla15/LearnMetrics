'use client';

import * as React from 'react';
import type {
  AssignmentAttemptsFilter,
  AttemptResultsRow,
  TeacherAssignmentAttemptRow,
  TeacherAssignmentAttemptsResponse,
} from '@/types';

import {
  AssignMakeupTestModal,
  AssignmentResultsCard,
  AssignmentSummaryCard,
  useAssignmentAttempts,
  useAssignMissing,
  useAttemptDetail,
} from '@/modules';
import { AttemptDetailModal } from '../../student-progress';

export function AssignmentDetailClient(props: {
  classroomId: number;
  assignmentId: number;
  initial: TeacherAssignmentAttemptsResponse;
}) {
  const { classroomId, assignmentId, initial } = props;

  const a = useAssignmentAttempts({ classroomId, assignmentId, initial });
  const detail = useAttemptDetail({ classroomId });
  const assign = useAssignMissing({ classroomId, attemptRows: a.rows });

  const tableRows: AttemptResultsRow[] = React.useMemo(
    () =>
      a.rows.map((r) => ({
        studentId: r.studentId,
        name: r.name,
        username: r.username,
        attemptId: r.attemptId,
        completedAt: r.completedAt ?? null,
        score: r.score ?? null,
        total: r.total ?? null,
        percent: r.percent ?? null,
        missed: r.missed ?? null,
        wasMastery: r.wasMastery ?? null,
        levelAtTime: r.levelAtTime ?? null,
      })),
    [a.rows],
  );

  function handleViewDetails(row: AttemptResultsRow) {
    if (!row.attemptId) return;
    const original = (a.rows as TeacherAssignmentAttemptRow[]).find(
      (x) => x.attemptId === row.attemptId,
    );
    if (original) void detail.openAttempt(original);
  }

  return (
    <div className="space-y-6">
      <AssignmentSummaryCard
        assignment={a.assignment}
        counts={a.counts}
        onAssign={() => void assign.openModal()}
      />

      <AssignmentResultsCard
        loading={a.loading}
        filter={a.filter}
        onChangeFilter={(next: AssignmentAttemptsFilter) => void a.reload(next)}
        rows={tableRows}
        onViewDetails={handleViewDetails}
      />

      <AssignMakeupTestModal
        open={assign.open}
        onClose={() => assign.setOpen(false)}
        classroomId={classroomId}
        students={assign.students}
        lastTestMeta={{
          numQuestions: a.assignment?.numQuestions ?? 12,
          windowMinutes: a.assignment?.windowMinutes ?? 4,
          questionSetId: null,
        }}
        defaultAudience="CUSTOM"
        defaultSelectedIds={assign.defaultSelectedIds}
        onCreated={async () => {
          await a.reload(a.filter);
        }}
      />

      {assign.loading ? (
        <div className="text-xs text-[hsl(var(--muted-fg))]">Loading students…</div>
      ) : null}
      {assign.error ? (
        <div className="text-xs text-[hsl(var(--danger))]">{assign.error}</div>
      ) : null}

      <AttemptDetailModal
        open={detail.open}
        onClose={detail.close}
        title="Attempt details"
        studentId={detail.selected?.studentId ?? null}
        studentName={detail.selected?.studentName ?? null}
        studentUsername={detail.selected?.studentUsername ?? null}
        detail={detail.detail as never}
        loading={detail.detailLoading}
        error={detail.detailError}
        showIncorrectOnly={detail.showIncorrectOnly}
        onToggleIncorrectOnly={detail.setShowIncorrectOnly}
      />
    </div>
  );
}
