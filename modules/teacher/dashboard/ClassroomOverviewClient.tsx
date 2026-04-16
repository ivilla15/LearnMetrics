'use client';

import * as React from 'react';
import type {
  ClassroomProgressDTO,
  TeacherClassroomOverviewStatsDTO,
  TeacherAssignmentListItemDTO,
  CalendarProjectionRowDTO,
} from '@/types';
import { useClassroomDashboard } from './hooks/useClassroomDashboard';
import { ClassHealthStrip } from './_components/ClassHealthStrip';
import { NeedsAttentionSection } from './_components/NeedsAttentionSection';
import { WeeklySnapshotSection } from './_components/WeeklySnapshotSection';
import { ComingUpSection } from './_components/ComingUpSection';
import { ClassroomIntegritySummary } from './_components/ClassroomIntegritySummary';

type Props = {
  classroomId: number;
  overview: TeacherClassroomOverviewStatsDTO;
  progress: ClassroomProgressDTO;
  upcomingAssignments: TeacherAssignmentListItemDTO[];
  projections: CalendarProjectionRowDTO[];
  nextTestOpensAt: string | null;
};

export function ClassroomOverviewClient({
  classroomId,
  overview,
  progress,
  upcomingAssignments,
  projections,
  nextTestOpensAt,
}: Props) {
  const attentionRef = React.useRef<HTMLDivElement>(null);

  const d = useClassroomDashboard({ overview, progress, upcomingAssignments, classroomId });

  function scrollToAtRisk() {
    attentionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const lastTest = progress.recent.last3Tests[0] ?? null;

  return (
    <div className="space-y-8">
      {/* Zone 1 — Class Health Strip */}
      <ClassHealthStrip
        overview={overview}
        summary={progress.summary}
        activeThisWeek={d.activeThisWeek}
        nextTestOpensAt={nextTestOpensAt}
        onScrollToAtRisk={scrollToAtRisk}
      />

      {/* Zone 1b — Integrity Summary (self-loading) */}
      <ClassroomIntegritySummary classroomId={classroomId} />

      {/* Zone 2 — Needs Attention */}
      <NeedsAttentionSection
        needsSetup={d.attention.needsSetup}
        noActivity={d.attention.noActivity}
        missedLastTest={d.attention.missedLastTest}
        lastTest={lastTest}
        classroomId={classroomId}
        sectionRef={attentionRef}
      />

      {/* Zone 3 — This Week's Snapshot */}
      <WeeklySnapshotSection
        students={progress.students}
        topMissedFacts={progress.insights.topMissedFacts}
        classroomId={classroomId}
      />

      {/* Zone 4 — Coming Up */}
      <ComingUpSection
        recentTests={progress.recent.last3Tests}
        upcomingAssignments={upcomingAssignments}
        projections={projections}
        classroomId={classroomId}
      />
    </div>
  );
}
