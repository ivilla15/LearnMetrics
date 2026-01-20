import * as React from 'react';
import type { TeacherClassroomOverviewStats } from '@/data';
import { StatTile } from './StatTile';
import { formatInTimeZone } from 'date-fns-tz';

function percent(numerator: number, denominator: number) {
  if (!denominator) return '—';
  const p = Math.round((numerator / denominator) * 100);
  return `${p}%`;
}

export function ClassroomStatsGrid({ stats }: { stats: TeacherClassroomOverviewStats }) {
  const nextTestValue = stats.nextTest
    ? formatInTimeZone(stats.nextTest.opensAt, stats.classroom.timeZone ?? 'UTC', 'MMM d, h:mm a')
    : '—';

  const nextTestHelper = stats.nextTest ? (
    <span>
      {stats.nextTest.assignmentMode === 'SCHEDULED' ? 'Scheduled' : 'Manual'}
      {' · '}
      Closes{' '}
      {formatInTimeZone(stats.nextTest.closesAt, stats.classroom.timeZone ?? 'UTC', 'h:mm a')}
    </span>
  ) : (
    <span>No upcoming tests found.</span>
  );

  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
      <StatTile
        label="Students"
        value={stats.totalStudents}
        helper={<span>Total enrolled in this classroom.</span>}
      />

      <StatTile
        label="Active"
        value={stats.activeStudents}
        tone="success"
        helper={<span>Students who already set a password.</span>}
      />

      <StatTile
        label="Needs setup"
        value={stats.needsSetup}
        tone={stats.needsSetup > 0 ? 'warning' : 'default'}
        helper={<span>Still need a new setup code / activation.</span>}
      />

      <StatTile
        label="Active schedules"
        value={stats.activeSchedules}
        helper={<span>Weekly schedules currently turned on.</span>}
      />

      <StatTile label="Next test" value={nextTestValue} helper={nextTestHelper} />

      <StatTile
        label="Mastery rate (7 days)"
        value={percent(stats.masteryLast7, stats.attemptsLast7)}
        tone={
          stats.masteryRateLast7 >= 80
            ? 'success'
            : stats.masteryRateLast7 >= 50
              ? 'warning'
              : 'danger'
        }
        helper={
          <span>
            {stats.masteryLast7}/{stats.attemptsLast7} mastered attempts in the last week.
          </span>
        }
      />
    </div>
  );
}
