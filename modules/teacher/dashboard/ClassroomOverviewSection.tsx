import * as React from 'react';
import { getTeacherClassroomOverview } from '@/core/classrooms/service';
import { getClassroomProgress } from '@/core/progress';
import { listTeacherAssignmentsForClassroom } from '@/core/assignments';
import { prisma } from '@/data/prisma';
import { localDateTimeToUtcRange, localDayToUtcDate } from '@/utils';
import type { CalendarProjectionRowDTO, TeacherClassroomOverviewStatsDTO } from '@/types';
import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { ClassroomOverviewClient } from './ClassroomOverviewClient';

type Props = {
  classroomId: number;
  teacherId: number;
};

/** Returns upcoming schedule projections (next 14 days) excluding already-materialized assignments. */
async function getUpcomingProjections(
  classroomId: number,
  tz: string,
): Promise<CalendarProjectionRowDTO[]> {
  const now = new Date();
  const DAYS = 14;
  const horizon = addDays(now, DAYS);

  const [schedules, existing] = await Promise.all([
    prisma.assignmentSchedule.findMany({
      where: { classroomId, isActive: true },
      select: {
        id: true,
        days: true,
        opensAtLocalTime: true,
        targetKind: true,
        type: true,
        operation: true,
        windowMinutes: true,
        numQuestions: true,
        durationMinutes: true,
      },
      orderBy: { id: 'asc' },
    }),
    prisma.assignment.findMany({
      where: {
        classroomId,
        scheduleId: { not: null },
        runDate: { not: null, gte: now, lte: horizon },
      },
      select: { scheduleId: true, runDate: true },
    }),
  ]);

  const realKeys = new Set(
    existing
      .filter((r) => r.scheduleId && r.runDate)
      .map((r) => `${r.scheduleId}|${r.runDate!.toISOString()}`),
  );

  const projections: CalendarProjectionRowDTO[] = [];

  for (const sched of schedules) {
    const days = Array.isArray(sched.days) ? (sched.days as string[]) : [];
    if (days.length === 0) continue;

    for (let i = 0; i < DAYS; i++) {
      const candidateBase = addDays(now, i);
      const dayName = formatInTimeZone(candidateBase, tz, 'EEEE');
      if (!days.includes(dayName)) continue;

      const localDate = formatInTimeZone(candidateBase, tz, 'yyyy-MM-dd');
      const runDate = localDayToUtcDate(localDate, tz);

      const key = `${sched.id}|${runDate.toISOString()}`;
      if (realKeys.has(key)) continue;

      const windowMinutes =
        (sched.targetKind === 'PRACTICE_TIME'
          ? (sched.durationMinutes ?? sched.windowMinutes)
          : sched.windowMinutes) ?? 60;

      const { opensAtUTC, closesAtUTC } = localDateTimeToUtcRange({
        localDate,
        localTime: sched.opensAtLocalTime,
        windowMinutes,
        tz,
      });

      if (opensAtUTC <= now) continue;

      projections.push({
        kind: 'projection',
        scheduleId: sched.id,
        runDate: runDate.toISOString(),
        opensAt: opensAtUTC.toISOString(),
        closesAt: closesAtUTC.toISOString(),
        mode: 'SCHEDULED',
        targetKind: sched.targetKind,
        type: sched.type ?? null,
        numQuestions: sched.targetKind === 'ASSESSMENT' ? (sched.numQuestions ?? 12) : null,
        windowMinutes: sched.windowMinutes ?? null,
        operation: sched.operation ?? null,
        durationMinutes:
          sched.targetKind === 'PRACTICE_TIME' ? (sched.durationMinutes ?? null) : null,
      });
    }
  }

  return projections.sort((a, b) => a.opensAt.localeCompare(b.opensAt));
}

/** Picks the soonest upcoming assignment opensAt from materialized overview + projections. */
function resolveNextTestOpensAt(
  nextTest: TeacherClassroomOverviewStatsDTO['nextTest'],
  projections: CalendarProjectionRowDTO[],
): string | null {
  const candidates: string[] = [];

  if (nextTest?.opensAt) candidates.push(nextTest.opensAt);
  for (const p of projections) candidates.push(p.opensAt);

  if (candidates.length === 0) return null;
  return candidates.sort()[0];
}

export async function ClassroomOverviewSection({ classroomId, teacherId }: Props) {
  const [overview, progress, assignmentsResponse] = await Promise.all([
    getTeacherClassroomOverview({ classroomId, teacherId }),
    getClassroomProgress({ teacherId, classroomId, days: 7 }),
    listTeacherAssignmentsForClassroom({
      teacherId,
      classroomId,
      status: 'upcoming',
      take: 10,
    }),
  ]);

  if (!overview) {
    return (
      <div className="rounded-[var(--radius)] border border-dashed border-[hsl(var(--border))] p-12 text-center">
        <p className="text-sm text-[hsl(var(--muted-fg))]">
          No overview data available for this classroom.
        </p>
      </div>
    );
  }

  const tz = overview.classroom.timeZone?.trim() || null;
  const projections = tz ? await getUpcomingProjections(classroomId, tz) : [];
  const nextTestOpensAt = resolveNextTestOpensAt(overview.nextTest, projections);

  return (
    <ClassroomOverviewClient
      classroomId={classroomId}
      overview={overview}
      progress={progress}
      upcomingAssignments={assignmentsResponse.rows}
      projections={projections}
      nextTestOpensAt={nextTestOpensAt}
    />
  );
}
