import * as React from 'react';
import Link from 'next/link';

import { requireStudent } from '@/core/auth';
import { getScheduledOccurrenceDetails } from '@/core';
import { AppPage } from '@/modules';
import { Card, CardContent, Section } from '@/components';
import { formatAssignmentType } from '@/types';
import { getStatus } from '@/utils';

function formatTypeLabel(params: {
  targetKind: 'ASSESSMENT' | 'PRACTICE_TIME';
  type: ReturnType<typeof getScheduledOccurrenceDetails> extends Promise<infer T>
    ? T extends { type: infer U }
      ? U
      : never
    : never;
}) {
  if (params.targetKind === 'PRACTICE_TIME') return 'Practice time';
  return params.type ? formatAssignmentType(params.type) : 'Assignment';
}

function formatTargetLine(params: {
  targetKind: 'ASSESSMENT' | 'PRACTICE_TIME';
  numQuestions: number | null;
  durationMinutes: number | null;
}) {
  if (params.targetKind === 'PRACTICE_TIME') {
    return `${params.durationMinutes ?? 0} minutes`;
  }

  return `${params.numQuestions ?? 0} questions`;
}

function formatDateTime(value: string | null) {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleString();
}

type PageProps = {
  params: Promise<{
    scheduleId: string;
  }>;
  searchParams: Promise<{
    classroomId?: string;
    runDate?: string;
  }>;
};

export default async function Page({ params, searchParams }: PageProps) {
  const auth = await requireStudent();
  if (!auth.ok) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">{auth.error}</div>;
  }

  const student = auth.student;
  const { scheduleId } = await params;
  const { classroomId, runDate } = await searchParams;

  const parsedScheduleId = Number(scheduleId);
  const parsedClassroomId = Number(classroomId);

  if (!Number.isFinite(parsedScheduleId) || parsedScheduleId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid schedule id</div>;
  }

  if (!Number.isFinite(parsedClassroomId) || parsedClassroomId <= 0) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Invalid classroom id</div>;
  }

  if (!runDate) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Missing run date</div>;
  }

  if (student.classroomId !== parsedClassroomId) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Not allowed</div>;
  }

  const detail = await getScheduledOccurrenceDetails({
    classroomId: parsedClassroomId,
    scheduleId: parsedScheduleId,
    runDate,
  });

  if (!detail) {
    return <div className="p-6 text-sm text-[hsl(var(--danger))]">Scheduled test not found</div>;
  }

  const title = formatTypeLabel({
    targetKind: detail.targetKind,
    type: detail.type,
  });

  const targetLine = formatTargetLine({
    targetKind: detail.targetKind,
    numQuestions: detail.numQuestions,
    durationMinutes: detail.durationMinutes,
  });

  const status = getStatus({
    opensAt: new Date(detail.opensAt),
    closesAt: detail.closesAt ? new Date(detail.closesAt) : null,
    now: new Date(),
  });

  const assignmentHref = detail.existingAssignmentId
    ? `/student/assignments/${detail.existingAssignmentId}`
    : null;

  const ctaLabel =
    detail.existingAssignmentId == null
      ? null
      : status === 'OPEN'
        ? 'Open test'
        : 'View assignment';

  return (
    <AppPage title={title} subtitle="Scheduled test details.">
      <Section>
        <div className="space-y-4">
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
                  This test has not been created as a live assignment yet.
                </div>
              ) : (
                <div className="rounded-(--radius) border border-[hsl(var(--success)/0.25)] bg-[hsl(var(--success)/0.08)] p-3 text-sm text-[hsl(var(--fg))]">
                  A live assignment exists for this scheduled test.
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {assignmentHref && ctaLabel ? (
                  <Link
                    href={assignmentHref}
                    className="inline-flex h-10 items-center justify-center rounded-(--radius) bg-[hsl(var(--brand))] px-4 text-sm font-medium text-white shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                  >
                    {ctaLabel}
                  </Link>
                ) : null}

                <Link
                  href="/student/calendar"
                  className="inline-flex h-10 items-center justify-center rounded-(--radius) bg-[hsl(var(--surface-2))] px-4 text-sm font-medium text-[hsl(var(--fg))] shadow-[0_4px_10px_rgba(0,0,0,0.08)]"
                >
                  Back to calendar
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Section>
    </AppPage>
  );
}
