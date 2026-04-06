'use client';

import * as React from 'react';
import type { ClassroomProgressStudentRowDTO, ClassroomProgressLastTestDTO } from '@/types';
import { NeedsAttentionCategory, NeedsAttentionCategorySkeleton } from './NeedsAttentionCategory';
import {
  NeedsSetupStudentRow,
  NoActivityStudentRow,
  MissedTestStudentRow,
} from './StudentAttentionRow';

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
        <div className="rounded-[18px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-5 py-4">
          <p className="text-sm text-[hsl(var(--success))] font-medium">
            ✓ All students are on track this week.
          </p>
        </div>
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

          <NeedsAttentionCategory label="Missed Last Test" tone="warning" count={missedLastTest.length}>
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

          <NeedsAttentionCategory label="No Recent Activity" tone="warning" count={noActivity.length}>
            <StudentList
              students={noActivity}
              renderRow={(s) => (
                <NoActivityStudentRow key={s.id} student={s} classroomId={classroomId} />
              )}
            />
          </NeedsAttentionCategory>
        </div>
      )}
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
      </div>
    </div>
  );
}
