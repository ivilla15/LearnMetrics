'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, Skeleton, Badge } from '@/components';
import type { TeacherAssignmentListItemDTO, CalendarProjectionRowDTO, AssignmentType, AssignmentMode } from '@/types';
import { formatDistanceToNowStrict, parseISO, differenceInHours } from 'date-fns';

type DisplayItem = {
  key: string;
  type: AssignmentType | null;
  mode: AssignmentMode;
  opensAt: string;
  closesAt: string | null;
  isProjection: boolean;
};

function toDisplayItems(
  assignments: TeacherAssignmentListItemDTO[],
  projections: CalendarProjectionRowDTO[],
): DisplayItem[] {
  const now = new Date();

  const fromAssignments: DisplayItem[] = assignments
    .filter((a) => parseISO(a.opensAt) > now)
    .map((a) => ({
      key: `a-${a.assignmentId}`,
      type: a.type,
      mode: a.mode,
      opensAt: a.opensAt,
      closesAt: a.closesAt,
      isProjection: false,
    }));

  const fromProjections: DisplayItem[] = projections
    .filter((p) => parseISO(p.opensAt) > now)
    .map((p) => ({
      key: `p-${p.scheduleId}-${p.runDate}`,
      type: p.type,
      mode: p.mode,
      opensAt: p.opensAt,
      closesAt: p.closesAt,
      isProjection: true,
    }));

  return [...fromAssignments, ...fromProjections]
    .sort((a, b) => a.opensAt.localeCompare(b.opensAt))
    .slice(0, 3);
}

function relativeDate(dateStr: string): { label: string; urgent: boolean } {
  const d = parseISO(dateStr);
  const hours = differenceInHours(d, new Date());
  const urgent = hours >= 0 && hours < 24;
  const label = urgent
    ? `In ${hours}h`
    : formatDistanceToNowStrict(d, { addSuffix: true });
  return { label, urgent };
}

type Props = {
  assignments: TeacherAssignmentListItemDTO[];
  projections: CalendarProjectionRowDTO[];
  classroomId: number;
};

export function UpcomingAssignmentsCard({ assignments, projections, classroomId }: Props) {
  const items = React.useMemo(
    () => toDisplayItems(assignments, projections),
    [assignments, projections],
  );

  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Upcoming Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.length === 0 ? (
          <div className="space-y-1">
            <p className="text-sm text-[hsl(var(--muted-fg))]">No upcoming assignments.</p>
            <Link
              href={`/teacher/classrooms/${classroomId}/assignments`}
              className="text-xs font-medium text-[hsl(var(--brand))] hover:underline"
            >
              Create one →
            </Link>
          </div>
        ) : (
          <>
            {items.map((item) => {
              const opens = relativeDate(item.opensAt);
              const closes = item.closesAt ? relativeDate(item.closesAt) : null;
              return (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-3 rounded-[14px] bg-[hsl(var(--surface-2))] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.type ? (
                        <Badge tone={item.type === 'TEST' ? 'primary' : 'muted'}>{item.type}</Badge>
                      ) : null}
                      <Badge tone="muted">{item.mode}</Badge>
                      {item.isProjection ? (
                        <Badge tone="muted">scheduled</Badge>
                      ) : null}
                      <span
                        className={[
                          'text-xs font-medium',
                          opens.urgent
                            ? 'text-[hsl(var(--warning))]'
                            : 'text-[hsl(var(--muted-fg))]',
                        ].join(' ')}
                      >
                        Opens {opens.label}
                      </span>
                    </div>
                    {closes ? (
                      <div
                        className={[
                          'mt-0.5 text-xs',
                          closes.urgent
                            ? 'text-[hsl(var(--warning))]'
                            : 'text-[hsl(var(--muted-fg))]',
                        ].join(' ')}
                      >
                        Closes {closes.label}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
            <div className="pt-1">
              <Link
                href={`/teacher/classrooms/${classroomId}/assignments`}
                className="text-xs font-medium text-[hsl(var(--brand))] hover:underline"
              >
                View all assignments →
              </Link>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function UpcomingAssignmentsSkeleton() {
  return (
    <Card className="shadow-[0_20px_60px_rgba(0,0,0,0.08)] rounded-[28px] border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Upcoming Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[14px] bg-[hsl(var(--surface-2))] px-3 py-2"
          >
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
