import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core';
import { clampInt, parseCursor, localDateTimeToUtcRange, localDayToUtcDate } from '@/utils';
import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import type { CalendarProjectionRowDTO } from '@/types';

export async function GET(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = clampInt(Number(url.searchParams.get('limit') ?? 50), 10, 200);
  const cursor = parseCursor(url.searchParams.get('cursor'));
  const statusRaw = (url.searchParams.get('status') ?? 'all').toLowerCase();
  const status: 'all' | 'open' | 'finished' | 'upcoming' =
    statusRaw === 'open' || statusRaw === 'finished' || statusRaw === 'upcoming'
      ? statusRaw
      : 'all';

  const student = auth.student;
  const classroom = await prisma.classroom.findUnique({
    where: { id: student.classroomId },
    select: { id: true, name: true, timeZone: true },
  });

  if (!classroom) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });

  const now = new Date();
  const whereBase = { classroomId: classroom.id };

  const where =
    status === 'open'
      ? { ...whereBase, opensAt: { lte: now }, OR: [{ closesAt: null }, { closesAt: { gt: now } }] }
      : whereBase;

  const take = limit + 1;
  const assignments = await prisma.assignment.findMany({
    where,
    take,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { opensAt: 'desc' },
    select: {
      id: true,
      type: true,
      mode: true,
      targetKind: true,
      opensAt: true,
      closesAt: true,
      numQuestions: true,
      windowMinutes: true,
      durationMinutes: true,
      scheduleId: true,
      runDate: true,
    },
  });

  const hasMore = assignments.length > limit;
  const page = hasMore ? assignments.slice(0, limit) : assignments;
  const nextCursor = hasMore && page.length > 0 ? String(page[page.length - 1]!.id) : null;

  const assignmentIds = page.map((a) => a.id);

  const attempts = assignmentIds.length
    ? await prisma.attempt.findMany({
        where: {
          studentId: student.id,
          assignmentId: { in: assignmentIds },
          completedAt: { not: null },
        },
        orderBy: [{ completedAt: 'desc' }, { id: 'desc' }],
        select: {
          id: true,
          assignmentId: true,
          completedAt: true,
          score: true,
          total: true,
          operationAtTime: true,
          levelAtTime: true,
          Assignment: {
            select: {
              type: true,
              mode: true,
            },
          },
        },
      })
    : [];

  const latestByAssignment = new Map<number, (typeof attempts)[number]>();

  for (const a of attempts) {
    if (!a.completedAt) continue;

    if (!latestByAssignment.has(a.assignmentId)) {
      latestByAssignment.set(a.assignmentId, a);
    }
  }

  const rows = page.map((a) => {
    return {
      kind: 'assignment' as const,
      assignmentId: a.id,
      type: a.type,
      mode: a.mode,
      targetKind: a.targetKind,
      opensAt: a.opensAt.toISOString(),
      closesAt: a.closesAt ? a.closesAt.toISOString() : null,
      windowMinutes: a.windowMinutes ?? null,
      numQuestions: a.numQuestions ?? 12,
      durationMinutes: a.durationMinutes ?? null,
      stats: undefined,
      scheduleId: a.scheduleId ?? null,
      runDate: a.runDate ? a.runDate.toISOString() : null,
    };
  });

  const projections: CalendarProjectionRowDTO[] = [];
  if (status === 'all') {
    const PROJECTION_DAYS = 60;
    const horizon = addDays(now, PROJECTION_DAYS);
    const tz = classroom.timeZone?.trim() ? classroom.timeZone : null;
    if (tz) {
      const schedules = await prisma.assignmentSchedule.findMany({
        where: { classroomId: classroom.id, isActive: true },
        select: {
          id: true,
          days: true,
          opensAtLocalTime: true,
          targetKind: true,
          type: true,
          windowMinutes: true,
          numQuestions: true,
          durationMinutes: true,
        },
      });

      const existing = await prisma.assignment.findMany({
        where: {
          classroomId: classroom.id,
          scheduleId: { not: null },
          runDate: { not: null, gte: now, lte: horizon },
        },
        select: { scheduleId: true, runDate: true },
      });

      const realKeys = new Set(
        existing
          .filter((r) => r.scheduleId && r.runDate)
          .map((r) => `${r.scheduleId}|${r.runDate!.toISOString()}`),
      );

      const scheduleIds = schedules.map((s) => s.id);
      const skipped = scheduleIds.length
        ? await prisma.assignmentScheduleRun.findMany({
            where: {
              scheduleId: { in: scheduleIds },
              runDate: { gte: now, lte: horizon },
              isSkipped: true,
            },
            select: { scheduleId: true, runDate: true },
          })
        : [];

      const skippedKeys = new Set(skipped.map((r) => `${r.scheduleId}|${r.runDate.toISOString()}`));

      for (const sched of schedules) {
        const days = Array.isArray(sched.days) ? sched.days : [];
        if (days.length === 0) continue;
        for (let i = 0; i < PROJECTION_DAYS; i++) {
          const candidateBase = addDays(now, i);
          const dayName = formatInTimeZone(candidateBase, tz, 'EEEE');
          if (!days.includes(dayName)) continue;

          const localDate = formatInTimeZone(candidateBase, tz, 'yyyy-MM-dd');
          const runDate = localDayToUtcDate(localDate, tz);

          const key = `${sched.id}|${runDate.toISOString()}`;
          if (realKeys.has(key)) continue;
          if (skippedKeys.has(key)) continue;

          const { opensAtUTC, closesAtUTC } = localDateTimeToUtcRange({
            localDate,
            localTime: sched.opensAtLocalTime,
            windowMinutes: sched.windowMinutes,
            tz,
          });

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
            durationMinutes:
              sched.targetKind === 'PRACTICE_TIME' ? (sched.durationMinutes ?? null) : null,
          });
        }
      }
    }
  }

  const dto = {
    classroom: { id: classroom.id, name: classroom.name, timeZone: classroom.timeZone },
    rows,
    projections,
    nextCursor,
  };

  return NextResponse.json(dto);
}
