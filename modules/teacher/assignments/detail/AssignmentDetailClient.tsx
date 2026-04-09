'use client';

import * as React from 'react';
import type {
  AssignmentAttemptsFilter,
  AttemptResultsRowDTO,
  TeacherAssignmentAttemptRowDTO,
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
import { Card, CardContent } from '@/components';

type IntegrityEvent = {
  id: number;
  eventType: string;
  occurredAt: string;
  student: { id: number; name: string; username: string };
};

function IntegrityEventsCard({
  classroomId,
  assignmentId,
}: {
  classroomId: number;
  assignmentId: number;
}) {
  const [events, setEvents] = React.useState<IntegrityEvent[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/teacher/classrooms/${classroomId}/assignments/${assignmentId}/events`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((j: unknown) => {
        if (cancelled) return;
        const rec = j as Record<string, unknown>;
        setEvents(Array.isArray(rec.events) ? (rec.events as IntegrityEvent[]) : []);
      })
      .catch(() => {
        if (!cancelled) setEvents([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, classroomId, assignmentId]);

  const EVENT_LABELS: Record<string, string> = {
    TAB_HIDDEN: 'Tab hidden',
    WINDOW_BLUR: 'Window blur',
    LEFT_PAGE: 'Left page',
    COPY_BLOCKED: 'Copy blocked',
    CUT_BLOCKED: 'Cut blocked',
    PASTE_BLOCKED: 'Paste blocked',
  };

  return (
    <Card className="shadow-sm">
      <CardContent className="py-5">
        <button
          type="button"
          className="flex w-full items-center justify-between text-left"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="text-sm font-semibold text-[hsl(var(--fg))]">
            Session integrity events
          </span>
          <span className="text-xs text-[hsl(var(--muted-fg))]">{open ? 'Hide' : 'Show'}</span>
        </button>

        {open ? (
          <div className="mt-4">
            {loading ? (
              <div className="text-xs text-[hsl(var(--muted-fg))]">Loading…</div>
            ) : !events || events.length === 0 ? (
              <div className="text-xs text-[hsl(var(--muted-fg))]">No integrity events recorded.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[hsl(var(--border))] text-left text-[hsl(var(--muted-fg))]">
                      <th className="pb-2 pr-4 font-medium">Student</th>
                      <th className="pb-2 pr-4 font-medium">Event</th>
                      <th className="pb-2 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[hsl(var(--border)/0.5)]">
                    {events.map((e) => (
                      <tr key={e.id}>
                        <td className="py-1.5 pr-4 font-medium text-[hsl(var(--fg))]">
                          {e.student.name}
                        </td>
                        <td className="py-1.5 pr-4 text-[hsl(var(--fg))]">
                          {EVENT_LABELS[e.eventType] ?? e.eventType}
                        </td>
                        <td className="py-1.5 text-[hsl(var(--muted-fg))]">
                          {new Date(e.occurredAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function AssignmentDetailClient(props: {
  classroomId: number;
  assignmentId: number;
  initial: TeacherAssignmentAttemptsResponse;
}) {
  const { classroomId, assignmentId, initial } = props;

  const a = useAssignmentAttempts({ classroomId, assignmentId, initial });
  const detail = useAttemptDetail({ classroomId });
  const assign = useAssignMissing({ classroomId, attemptRows: a.rows });

  const tableRows: AttemptResultsRowDTO[] = React.useMemo(
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

  function handleViewDetails(row: AttemptResultsRowDTO) {
    if (!row.attemptId) return;
    const original = (a.rows as TeacherAssignmentAttemptRowDTO[]).find(
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
        targetKind={a.assignment?.targetKind ?? null}
        filter={a.filter}
        onChangeFilter={(next: AssignmentAttemptsFilter) => void a.reload(next)}
        rows={tableRows}
        onViewDetails={handleViewDetails}
      />

      {a.assignment?.targetKind === 'PRACTICE_TIME' ? null : (
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
      )}

      {assign.loading ? (
        <div className="text-xs text-[hsl(var(--muted-fg))]">Loading students…</div>
      ) : null}
      {assign.error ? (
        <div className="text-xs text-[hsl(var(--danger))]">{assign.error}</div>
      ) : null}

      {a.assignment?.targetKind === 'ASSESSMENT' ? (
        <IntegrityEventsCard classroomId={classroomId} assignmentId={assignmentId} />
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
