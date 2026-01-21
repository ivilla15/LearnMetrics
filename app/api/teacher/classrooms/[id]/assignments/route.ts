import { prisma } from '@/data/prisma';
import type { Prisma } from '@prisma/client';

import { requireTeacher } from '@/core';
import { errorResponse, jsonResponse, parseCursor, parseId, percent } from '@/utils';
import { handleApiError, type RouteContext } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';

import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { localDayToUtcDate, localDateTimeToUtcRange } from '@/utils';

function clampLimit(raw: string | null) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 20;
  return Math.min(Math.max(Math.floor(n), 5), 50);
}

function parseStatus(raw: string | null): 'all' | 'open' | 'closed' | 'upcoming' {
  const v = (raw ?? 'all').toLowerCase();
  if (v === 'open' || v === 'closed' || v === 'upcoming') return v;
  return 'all';
}

type ScheduledProjectionRow = {
  kind: 'projection';
  scheduleId: number;
  runDate: string; // ISO
  opensAt: string; // ISO UTC
  closesAt: string; // ISO UTC
  windowMinutes: number | null;
  numQuestions: number;
  assignmentMode: 'SCHEDULED';
};

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const classroomId = parseId(id);
    if (!classroomId) return errorResponse('Invalid classroom id', 400);

    const classroom = await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const url = new URL(req.url);
    const cursor = parseCursor(url.searchParams.get('cursor'));
    const limit = clampLimit(url.searchParams.get('limit'));
    const status = parseStatus(url.searchParams.get('status'));
    const now = new Date();

    const where: Prisma.AssignmentWhereInput = { classroomId };

    if (status === 'open') {
      where.opensAt = { lte: now };
      where.closesAt = { gt: now };
    } else if (status === 'closed') {
      where.closesAt = { lte: now };
    } else if (status === 'upcoming') {
      where.opensAt = { gt: now };
    }

    const take = limit + 1;

    const assignments = await prisma.assignment.findMany({
      where,
      take,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { id: 'desc' },
      select: {
        id: true,
        kind: true,
        assignmentMode: true,
        opensAt: true,
        closesAt: true,
        windowMinutes: true,
        numQuestions: true,

        scheduleId: true,
        runDate: true,
      },
    });

    const page = assignments.slice(0, limit);
    const hasMore = assignments.length > limit;
    const nextCursor = hasMore ? String(page[page.length - 1].id) : null;

    const totalStudents = await prisma.student.count({ where: { classroomId } });

    const assignmentIds = page.map((a) => a.id);

    const attempts = assignmentIds.length
      ? await prisma.attempt.findMany({
          where: { assignmentId: { in: assignmentIds } },
          select: { assignmentId: true, score: true, total: true },
        })
      : [];

    const statsByAssignment = new Map<
      number,
      { attemptedCount: number; masteryCount: number; sumPercent: number; total: number }
    >();

    for (const a of attempts) {
      const s = statsByAssignment.get(a.assignmentId) ?? {
        attemptedCount: 0,
        masteryCount: 0,
        sumPercent: 0,
        total: 0,
      };

      s.attemptedCount += 1;

      const p = percent(a.score, a.total);
      s.sumPercent += p;
      s.total += 1;

      if (a.total > 0 && a.score === a.total) s.masteryCount += 1;

      statsByAssignment.set(a.assignmentId, s);
    }

    const rows = page.map((a) => {
      const s = statsByAssignment.get(a.id) ?? {
        attemptedCount: 0,
        masteryCount: 0,
        sumPercent: 0,
        total: 0,
      };

      const avgPercent = s.total > 0 ? Math.round(s.sumPercent / s.total) : 0;
      const masteryRate = s.total > 0 ? Math.round((s.masteryCount / s.total) * 100) : 0;

      return {
        assignmentId: a.id,
        kind: a.kind,
        assignmentMode: a.assignmentMode,
        opensAt: a.opensAt.toISOString(),
        closesAt: a.closesAt.toISOString(),
        windowMinutes: a.windowMinutes,
        numQuestions: a.numQuestions ?? 12,
        stats: {
          attemptedCount: s.attemptedCount,
          totalStudents,
          masteryRate,
          avgPercent,
        },
      };
    });

    const projections: ScheduledProjectionRow[] = [];

    if (status === 'all') {
      const PROJECTION_DAYS = 60;
      const horizon = addDays(now, PROJECTION_DAYS);
      const tz =
        classroom.timeZone && classroom.timeZone.trim().length > 0
          ? classroom.timeZone
          : 'America/Los_Angeles';

      // 1) Active schedules for this classroom
      const schedules = await prisma.assignmentSchedule.findMany({
        where: { classroomId, isActive: true },
        select: {
          id: true,
          days: true,
          opensAtLocalTime: true, // "HH:mm"
          windowMinutes: true,
          numQuestions: true,
        },
        orderBy: { id: 'asc' },
      });

      // 2) Real scheduled assignments in horizon -> keys to dedupe
      const existingRuns = await prisma.assignment.findMany({
        where: {
          classroomId,
          scheduleId: { not: null },
          runDate: { not: null, gte: now, lte: horizon },
        },
        select: { scheduleId: true, runDate: true },
      });

      const realKeys = new Set<string>();
      for (const r of existingRuns) {
        if (r.scheduleId && r.runDate) {
          realKeys.add(`${r.scheduleId}|${r.runDate.toISOString()}`);
        }
      }

      // 3) Skipped/tombstoned runs -> keys to exclude
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

      // 4) Generate day-by-day candidates in the classroom TZ
      for (const sched of schedules) {
        const days = Array.isArray(sched.days) ? sched.days : [];
        if (days.length === 0) continue;

        for (let i = 0; i < PROJECTION_DAYS; i++) {
          const candidateBase = addDays(now, i);

          const dayName = formatInTimeZone(candidateBase, tz, 'EEEE'); // "Friday"
          if (!days.includes(dayName)) continue;

          const localDate = formatInTimeZone(candidateBase, tz, 'yyyy-MM-dd'); // "2026-01-23"
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
            windowMinutes: sched.windowMinutes,
            numQuestions: sched.numQuestions ?? 12,
            assignmentMode: 'SCHEDULED',
          });
        }
      }
    }

    return jsonResponse(
      {
        classroom: {
          id: classroom.id,
          name: classroom.name,
          timeZone: classroom.timeZone,
        },
        rows,
        projections,
        nextCursor,
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
