import * as React from 'react';
import Link from 'next/link';

import { requireTeacher } from '@/core/auth';
import { getScheduledOccurrenceDetails } from '@/core';

import { PageHeader, Section, Card, CardContent } from '@/components';
import { ClassroomSubNav } from '@/modules';
import { formatCalendarTargetLine, formatCalendarTypeLabel } from '@/types';

type PageProps = {
  params: Promise<{
    id: string;
    scheduleId: string;
  }>;
  searchParams: Promise<{
    runDate?: string;
  }>;
};

function formatDateTime(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString();
}

export default async function Page({ params, searchParams }: PageProps) {
  const auth = await requireTeacher();
  if (!auth.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;
  }

  const { id, scheduleId } = await params;
  const { runDate } = await searchParams;

  const classroomId = Number(id);
  const parsedScheduleId = Number(scheduleId);

  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }

  if (!Number.isFinite(parsedScheduleId) || parsedScheduleId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid schedule id</div>;
  }

  if (!runDate) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Missing run date</div>;
  }

  const detail = await getScheduledOccurrenceDetails({
    classroomId,
    scheduleId: parsedScheduleId,
    runDate,
  });

  if (!detail) {
    return (
      <div className="p-6 text-sm text-[hsl(var(--danger))]">Scheduled occurrence not found</div>
    );
  }

  const title = formatCalendarTypeLabel({
    targetKind: detail.targetKind,
    type: detail.type,
  });

  const targetLine = formatCalendarTargetLine({
    targetKind: detail.targetKind,
    numQuestions: detail.numQuestions,
    durationMinutes: detail.durationMinutes,
  });

  const currentPath = `/teacher/classrooms/${classroomId}/calendar`;

  const assignmentHref = detail.existingAssignmentId
    ? `/teacher/classrooms/${classroomId}/assignments/${detail.existingAssignmentId}`
    : null;

  return (
    <>
      <PageHeader title={title} subtitle="Scheduled assignment details." />

      <Section className="space-y-4">
        <ClassroomSubNav classroomId={classroomId} currentPath={currentPath} variant="tabs" />

        <Card className="shadow-sm">
          <CardContent className="py-6 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Type</div>
                <div className="mt-1 text-base font-semibold text-[hsl(var(--fg))]">{title}</div>
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Target</div>
                <div className="mt-1 text-base font-semibold text-[hsl(var(--fg))]">
                  {targetLine}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Opens</div>
                <div className="mt-1 text-base font-semibold text-[hsl(var(--fg))]">
                  {formatDateTime(detail.opensAt)}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Closes</div>
                <div className="mt-1 text-base font-semibold text-[hsl(var(--fg))]">
                  {formatDateTime(detail.closesAt)}
                </div>
              </div>

              {detail.targetKind !== 'PRACTICE_TIME' ? (
                <div>
                  <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">
                    Window minutes
                  </div>
                  <div className="mt-1 text-base font-semibold text-[hsl(var(--fg))]">
                    {detail.windowMinutes ?? '—'}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Run date</div>
                <div className="mt-1 text-base font-semibold text-[hsl(var(--fg))]">
                  {detail.runDate}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-[hsl(var(--muted-fg))]">Status</div>
                <div className="mt-1 text-base font-semibold text-[hsl(var(--fg))]">
                  {detail.isSkipped
                    ? 'Canceled'
                    : detail.existingAssignmentId
                      ? 'Live assignment exists'
                      : 'Not created yet'}
                </div>
              </div>
            </div>

            {detail.isSkipped ? (
              <div className="rounded-(--radius) border border-[hsl(var(--danger)/0.35)] bg-[hsl(var(--danger)/0.08)] p-3 text-sm text-[hsl(var(--fg))]">
                This scheduled occurrence was canceled.
                {detail.skipReason ? ` Reason: ${detail.skipReason}` : ''}
              </div>
            ) : null}

            {!detail.isActive ? (
              <div className="rounded-(--radius) border border-[hsl(var(--muted-fg)/0.25)] bg-[hsl(var(--surface-2))] p-3 text-sm text-[hsl(var(--fg))]">
                This schedule is currently inactive.
              </div>
            ) : null}

            {detail.existingAssignmentId == null ? (
              <div className="rounded-(--radius) border border-[hsl(var(--brand)/0.25)] bg-[hsl(var(--brand)/0.08)] p-3 text-sm text-[hsl(var(--fg))]">
                This scheduled occurrence has not been created as a live assignment yet.
              </div>
            ) : (
              <div className="rounded-(--radius) border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.08)] p-3 text-sm text-[hsl(var(--fg))]">
                A live assignment exists for this scheduled occurrence.
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              {assignmentHref ? (
                <Link
                  href={assignmentHref}
                  className="inline-flex h-10 items-center justify-center rounded-(--radius) bg-[hsl(var(--brand))] px-4 text-sm font-medium text-white shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                >
                  View assignment
                </Link>
              ) : null}

              <Link
                href={`/teacher/classrooms/${classroomId}/calendar`}
                className="inline-flex h-10 items-center justify-center rounded-(--radius) bg-[hsl(var(--surface-2))] px-4 text-sm font-medium text-[hsl(var(--fg))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
              >
                Back to calendar
              </Link>
            </div>
          </CardContent>
        </Card>
      </Section>
    </>
  );
}
