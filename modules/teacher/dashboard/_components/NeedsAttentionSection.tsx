'use client';

import * as React from 'react';
import Link from 'next/link';
import type { ClassroomProgressStudentRowDTO, ClassroomProgressLastTestDTO } from '@/types';
import type { TeacherAssignmentListItemDTO } from '@/types';
import { NeedsAttentionCategory, NeedsAttentionCategorySkeleton } from './NeedsAttentionCategory';
import {
  NeedsSetupStudentRow,
  NoActivityStudentRow,
  MissedTestStudentRow,
} from './StudentAttentionRow';
import { formatLocal } from '@/lib';
import { Card, CardHeader } from '@/components';

const MAX_VISIBLE = 5;

function StudentList<T>({
  students,
  renderRow,
}: {
  students: T[];
  renderRow: (s: T) => React.ReactNode;
}) {
  const [showAll, setShowAll] = React.useState(false);
  const visible = showAll ? students : students.slice(0, MAX_VISIBLE);
  const hidden = students.length - MAX_VISIBLE;

  return (
    <>
      {visible.map((s, i) => (
        <React.Fragment key={i}>{renderRow(s)}</React.Fragment>
      ))}
      {!showAll && hidden > 0 ? (
        <div className="py-2">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="text-xs font-medium text-[hsl(var(--brand))] hover:underline"
          >
            Show {hidden} more
          </button>
        </div>
      ) : null}
    </>
  );
}

type IntegrityItem = Pick<TeacherAssignmentListItemDTO, 'assignmentId' | 'opensAt' | 'type'> & {
  flaggedCount: number;
  integrityEventCount: number;
};

/**
 * Self-fetching integrity category. Returns null when no flagged items found.
 * Always mounts so it loads in the background regardless of what other categories show.
 */
function IntegrityReviewCategory({ classroomId }: { classroomId: number }) {
  const [items, setItems] = React.useState<IntegrityItem[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/teacher/classrooms/${classroomId}/assignments?limit=50`, {
      credentials: 'include',
      cache: 'no-store',
    })
      .then((r) => r.json())
      .then((j: unknown) => {
        if (cancelled) return;
        const data = j as { rows?: TeacherAssignmentListItemDTO[] };
        const flagged: IntegrityItem[] = (data.rows ?? [])
          .filter(
            (r) => (r.stats?.flaggedCount ?? 0) > 0 || (r.stats?.integrityEventCount ?? 0) > 0,
          )
          .map((r) => ({
            assignmentId: r.assignmentId,
            opensAt: r.opensAt,
            type: r.type,
            flaggedCount: r.stats.flaggedCount,
            integrityEventCount: r.stats.integrityEventCount ?? 0,
          }));
        setItems(flagged);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  if (!items || items.length === 0) return null;

  return (
    <NeedsAttentionCategory label="Integrity Review" tone="danger" count={items.length}>
      {items.map((item) => (
        <div key={item.assignmentId} className="flex items-center justify-between gap-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-[hsl(var(--fg))] truncate">
              {item.type} · {formatLocal(item.opensAt)}
            </span>
            {item.flaggedCount > 0 ? (
              <span className="shrink-0 text-xs font-semibold text-[hsl(var(--danger))]">
                {item.flaggedCount} flagged
              </span>
            ) : (
              <span className="shrink-0 text-xs font-semibold text-amber-600">
                {item.integrityEventCount} event{item.integrityEventCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <Link
            href={`/teacher/classrooms/${classroomId}/assignments/${item.assignmentId}`}
            className="shrink-0 text-xs font-medium text-[hsl(var(--brand))] hover:underline"
          >
            Review
          </Link>
        </div>
      ))}
    </NeedsAttentionCategory>
  );
}

type Props = {
  needsSetup: ClassroomProgressStudentRowDTO[];
  noActivity: ClassroomProgressStudentRowDTO[];
  missedLastTest: ClassroomProgressStudentRowDTO[];
  lastTest: ClassroomProgressLastTestDTO | null;
  classroomId: number;
  sectionRef?: React.RefObject<HTMLDivElement | null>;
};

export function NeedsAttentionSection({
  needsSetup,
  noActivity,
  missedLastTest,
  lastTest,
  classroomId,
  sectionRef,
}: Props) {
  const allOnTrack =
    needsSetup.length === 0 && noActivity.length === 0 && missedLastTest.length === 0;

  return (
    <div ref={sectionRef} className="space-y-3">
      <h2 className="text-base font-semibold text-[hsl(var(--fg))]">Needs Attention</h2>

      {allOnTrack ? (
        <Card>
          <CardHeader className="flex items-center gap-1.5">
            <span className="text-2xl font-bold text-[hsl(var(--success))]">✓</span>
            <span className="text-sm text-[hsl(var(--success))] font-medium">
              All students are on track this week.
            </span>
          </CardHeader>
        </Card>
      ) : (
        <div className="space-y-3">
          <NeedsAttentionCategory label="Needs Setup" tone="warning" count={needsSetup.length}>
            <StudentList
              students={needsSetup}
              renderRow={(s) => (
                <NeedsSetupStudentRow key={s.id} student={s} classroomId={classroomId} />
              )}
            />
          </NeedsAttentionCategory>

          <NeedsAttentionCategory
            label="Missed Last Test"
            tone="warning"
            count={missedLastTest.length}
          >
            <StudentList
              students={missedLastTest}
              renderRow={(s) => (
                <MissedTestStudentRow
                  key={s.id}
                  student={s}
                  classroomId={classroomId}
                  lastTest={lastTest}
                />
              )}
            />
          </NeedsAttentionCategory>

          <NeedsAttentionCategory
            label="No Recent Activity"
            tone="warning"
            count={noActivity.length}
          >
            <StudentList
              students={noActivity}
              renderRow={(s) => (
                <NoActivityStudentRow key={s.id} student={s} classroomId={classroomId} />
              )}
            />
          </NeedsAttentionCategory>
        </div>
      )}

      {/* Integrity Review — always mounted so it loads, shows only when items exist */}
      <IntegrityReviewCategory classroomId={classroomId} />
    </div>
  );
}

export function NeedsAttentionSkeleton() {
  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-[hsl(var(--fg))]">Needs Attention</h2>
      <div className="space-y-3">
        <NeedsAttentionCategorySkeleton label="Needs Setup" />
        <NeedsAttentionCategorySkeleton label="Missed Last Test" />
        <NeedsAttentionCategorySkeleton label="No Recent Activity" />
        <NeedsAttentionCategorySkeleton label="Integrity Review" />
      </div>
    </div>
  );
}
