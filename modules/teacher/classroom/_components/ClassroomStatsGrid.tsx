import * as React from 'react';
import type { TeacherClassroomOverviewStats } from '@/data';
import { StatTile } from '../../../../components/StatTile';
import { formatInTimeZone } from 'date-fns-tz';

function percent(numerator: number, denominator: number) {
  if (!denominator) return '—';
  const p = Math.round((numerator / denominator) * 100);
  return `${p}%`;
}

export function ClassroomStatsGrid({ stats }: { stats: TeacherClassroomOverviewStats }) {
  const tz = stats.classroom.timeZone ?? 'UTC';

  const nextTestValue = stats.nextTest
    ? formatInTimeZone(stats.nextTest.opensAt, tz, 'MMM d, h:mm a')
    : '—';

  const nextTestHelper = stats.nextTest ? (
    <span>
      {stats.nextTest.mode === 'SCHEDULED'
        ? 'Scheduled'
        : stats.nextTest.mode === 'MAKEUP'
          ? 'Make up'
          : 'Manual'}
      {' · '}
      Closes{' '}
      {stats.nextTest.closesAt ? formatInTimeZone(stats.nextTest.closesAt, tz, 'h:mm a') : '—'}
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
