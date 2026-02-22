import { prisma } from '@/data/prisma';
import type { Prisma } from '@prisma/client';
import { createScheduledAssignment, requireTeacher, assertTeacherOwnsClassroom } from '@/core';
import { handleApiError, readJson, type RouteContext } from '@/app';
import {
  localDayToUtcDate,
  localDateTimeToUtcRange,
  clampInt,
  percent,
  errorResponse,
  jsonResponse,
} from '@/utils';

import type { CalendarProjectionRowDTO } from '@/types';
import { createTeacherAssignmentBodySchema } from '@/validation';
import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { parseId, parseCursor } from '@/utils';

type Ctx = RouteContext<{ id: string }>;

export async function GET(req: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const classroomId = parseId(id);
    if (!classroomId) return errorResponse('Invalid classroom id', 400);

    const classroom = await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const url = new URL(req.url);

    const cursor = parseCursor(url.searchParams.get('cursor'));

    const limit = clampInt(Number(url.searchParams.get('limit') ?? 20), 5, 50);

    const statusRaw = (url.searchParams.get('status') ?? 'all').toLowerCase();
    const status: 'all' | 'open' | 'finished' | 'upcoming' =
      statusRaw === 'closed'
        ? 'finished'
        : statusRaw === 'open' || statusRaw === 'finished' || statusRaw === 'upcoming'
          ? statusRaw
          : 'all';

    const modeRaw = (url.searchParams.get('mode') ?? 'all').toUpperCase();
    const mode: 'all' | 'SCHEDULED' | 'MAKEUP' | 'MANUAL' =
      modeRaw === 'SCHEDULED' || modeRaw === 'MAKEUP' || modeRaw === 'MANUAL' ? modeRaw : 'all';

    const typeRaw = (url.searchParams.get('type') ?? 'all').toUpperCase();
    const type: 'all' | 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT' =
      typeRaw === 'TEST' ||
      typeRaw === 'PRACTICE' ||
      typeRaw === 'REMEDIATION' ||
      typeRaw === 'PLACEMENT'
        ? typeRaw
        : 'all';

    const now = new Date();

    const where: Prisma.AssignmentWhereInput = { classroomId };

    if (mode !== 'all') where.mode = mode;
    if (type !== 'all') where.type = type;

    if (status === 'open') {
      where.opensAt = { lte: now };
      where.OR = [{ closesAt: null }, { closesAt: { gt: now } }];
    } else if (status === 'finished') {
      where.AND = [{ closesAt: { not: null } }, { closesAt: { lte: now } }];
    } else if (status === 'upcoming') {
      where.opensAt = { gt: now };
    }

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
        opensAt: true,
        closesAt: true,
        numQuestions: true,
        scheduleId: true,
        runDate: true,
      },
    });

    const page = assignments.slice(0, limit);
    const hasMore = assignments.length > limit;
    const nextCursor = hasMore && page.length > 0 ? String(page[page.length - 1].id) : null;

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

    const nowMs = Date.now();

    const rows = page.map((a) => {
      const s = statsByAssignment.get(a.id) ?? {
        attemptedCount: 0,
        masteryCount: 0,
        sumPercent: 0,
        total: 0,
      };

      const opens = a.opensAt.getTime();
      const closes = a.closesAt ? a.closesAt.getTime() : null;

      const derived =
        opens > nowMs ? 'UPCOMING' : closes !== null && closes <= nowMs ? 'FINISHED' : 'OPEN';

      const avgPercent = s.total > 0 ? Math.round(s.sumPercent / s.total) : 0;
      const masteryRate = s.total > 0 ? Math.round((s.masteryCount / s.total) * 100) : 0;

      return {
        assignmentId: a.id,
        type: a.type,
        mode: a.mode,
        status: derived,
        opensAt: a.opensAt.toISOString(),
        closesAt: a.closesAt ? a.closesAt.toISOString() : null,
        numQuestions: a.numQuestions ?? 12,
        scheduleId: a.scheduleId ?? null,
        runDate: a.runDate ? a.runDate.toISOString() : null,
        stats: {
          attemptedCount: s.attemptedCount,
          totalStudents,
          masteryRate: derived === 'FINISHED' ? masteryRate : null,
          avgPercent: derived === 'FINISHED' ? avgPercent : null,
        },
      };
    });

    const projections: CalendarProjectionRowDTO[] = [];

    // Only project when viewing "all" so the calendar can show future schedule dots
    if (status === 'all') {
      const PROJECTION_DAYS = 60;
      const horizon = addDays(now, PROJECTION_DAYS);

      const tz = classroom.timeZone?.trim() ? classroom.timeZone : null;
      if (!tz) {
        return errorResponse(
          'Classroom time zone is not set. Please set a time zone to view schedule projections.',
          409,
        );
      }

      const schedules = await prisma.assignmentSchedule.findMany({
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
      });

      const existing = await prisma.assignment.findMany({
        where: {
          classroomId,
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

          const windowMinutes =
            sched.targetKind === 'PRACTICE_TIME'
              ? (sched.durationMinutes ?? sched.windowMinutes)
              : sched.windowMinutes;

          const { opensAtUTC, closesAtUTC } = localDateTimeToUtcRange({
            localDate,
            localTime: sched.opensAtLocalTime,
            windowMinutes,
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
            operation: sched.operation ?? null,

            durationMinutes:
              sched.targetKind === 'PRACTICE_TIME' ? (sched.durationMinutes ?? null) : null,
          });
        }
      }
    }

    return jsonResponse(
      {
        classroom: { id: classroom.id, name: classroom.name, timeZone: classroom.timeZone },
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

export async function POST(req: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const classroomId = parseId(id);
    if (!classroomId) return errorResponse('Invalid classroom id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const body = await readJson(req);
    const input = createTeacherAssignmentBodySchema.parse(body);

    const opensAt = new Date(input.opensAt);
    const closesAt = input.closesAt ? new Date(input.closesAt) : null;

    const scheduleId = input.scheduleId ?? null;
    const runDate = input.runDate ? new Date(input.runDate) : null;

    const dto = await createScheduledAssignment({
      teacherId: auth.teacher.id,
      classroomId,
      opensAt,
      closesAt:
        closesAt ??
        new Date(new Date(input.opensAt).getTime() + (input.windowMinutes ?? 4) * 60_000),
      windowMinutes: input.windowMinutes ?? null,
      mode: input.mode,
      type: input.type ?? 'TEST',
      numQuestions: input.numQuestions ?? 12,
      studentIds: input.studentIds,
      scheduleId,
      runDate: runDate ?? undefined,
    });

    return jsonResponse({ assignment: dto }, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
