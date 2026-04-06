'use client';

import * as React from 'react';
import type {
  ClassroomProgressDTO,
  ClassroomProgressStudentRowDTO,
  TeacherClassroomOverviewStatsDTO,
  TeacherAssignmentListItemDTO,
} from '@/types';

export type DashboardData = {
  overview: TeacherClassroomOverviewStatsDTO;
  progress: ClassroomProgressDTO;
  upcomingAssignments: TeacherAssignmentListItemDTO[];
  classroomId: number;
};

type AttentionCategories = {
  needsSetup: ClassroomProgressStudentRowDTO[];
  noActivity: ClassroomProgressStudentRowDTO[];
  missedLastTest: ClassroomProgressStudentRowDTO[];
};

function deriveAttentionCategories(students: ClassroomProgressStudentRowDTO[]): AttentionCategories {
  const needsSetup: ClassroomProgressStudentRowDTO[] = [];
  const noActivity: ClassroomProgressStudentRowDTO[] = [];
  const missedLastTest: ClassroomProgressStudentRowDTO[] = [];

  for (const s of students) {
    if (s.flags.needsSetup) {
      // Can't log in at all — most actionable first
      needsSetup.push(s);
    } else if (s.flags.missedLastTest) {
      // Missed the most recent test — checked before noActivity because
      // missing a test implies noAttemptsInRange for that period
      missedLastTest.push(s);
    } else if (s.flags.stale14Days || s.flags.noAttemptsInRange) {
      noActivity.push(s);
    }
  }

  return { needsSetup, noActivity, missedLastTest };
}

export function useClassroomDashboard({ overview, progress, upcomingAssignments, classroomId }: DashboardData) {
  const attention = React.useMemo(
    () => deriveAttentionCategories(progress.students),
    [progress.students],
  );

  const allOnTrack =
    attention.needsSetup.length === 0 &&
    attention.noActivity.length === 0 &&
    attention.missedLastTest.length === 0;

  const activeThisWeek = React.useMemo(() => {
    return progress.students.filter((s) => s.attemptsInRange > 0).length;
  }, [progress.students]);

  return {
    overview,
    progress,
    upcomingAssignments,
    classroomId,
    attention,
    allOnTrack,
    activeThisWeek,
    totalStudents: progress.summary.studentsTotal,
  };
}
