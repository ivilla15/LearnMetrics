import { prisma } from '@/data/prisma';
import type { Prisma } from '@prisma/client';

import { createScheduledAssignment, requireTeacher } from '@/core';
import { errorResponse, jsonResponse, parseCursor, parseId, percent } from '@/utils';
import { handleApiError, readJson, type RouteContext } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';

import { addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

import { localDayToUtcDate, localDateTimeToUtcRange } from '@/utils';
import type { CalendarProjectionRow } from '@/types';

function clampLimit(raw: string | null) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 20;
  return Math.min(Math.max(Math.floor(n), 5), 50);
}

function parseStatus(raw: string | null): 'all' | 'open' | 'finished' | 'upcoming' {
  const v = (raw ?? 'all').toLowerCase();

  // backward compat: old URLs used "closed"
  if (v === 'closed') return 'finished';

  if (v === 'open' || v === 'finished' || v === 'upcoming') return v;
  return 'all';
}

function parseMode(raw: string | null): 'all' | 'SCHEDULED' | 'MAKEUP' | 'MANUAL' {
  const v = (raw ?? 'all').toUpperCase();
  if (v === 'SCHEDULED' || v === 'MAKEUP' || v === 'MANUAL') return v;
  return 'all';
}

function parseType(raw: string | null): 'all' | 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT' {
  const v = (raw ?? 'all').toUpperCase();
  if (v === 'TEST' || v === 'PRACTICE' || v === 'REMEDIATION' || v === 'PLACEMENT') return v;
  return 'all';
}

function isValidDate(d: Date) {
  return !Number.isNaN(d.getTime());
}

function deriveStatus(a: { opensAt: Date; closesAt: Date | null }) {
  const now = Date.now();
  const opens = a.opensAt.getTime();
  const closes = a.closesAt ? a.closesAt.getTime() : null;

  if (opens > now) return 'UPCOMING' as const;
  if (closes !== null && closes <= now) return 'FINISHED' as const;
  return 'OPEN' as const;
}

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
    const mode = parseMode(url.searchParams.get('mode'));
    const type = parseType(url.searchParams.get('type'));

    const now = new Date();

    const where: Prisma.AssignmentWhereInput = { classroomId };

    // mode/type filters
    if (mode !== 'all') where.mode = mode;
    if (type !== 'all') where.type = type;

    // status filters
    if (status === 'open') {
      // opensAt <= now AND (closesAt is null OR closesAt > now)
      where.opensAt = { lte: now };
      where.OR = [{ closesAt: null }, { closesAt: { gt: now } }];
    } else if (status === 'finished') {
      // closesAt <= now (must be non-null)
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
        windowMinutes: true,
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

    const rows = page.map((a) => {
      const s = statsByAssignment.get(a.id) ?? {
        attemptedCount: 0,
        masteryCount: 0,
        sumPercent: 0,
        total: 0,
      };

      const derived = deriveStatus({ opensAt: a.opensAt, closesAt: a.closesAt });

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

    const projections: CalendarProjectionRow[] = [];

    if (status === 'all') {
      const PROJECTION_DAYS = 60;
      const horizon = addDays(now, PROJECTION_DAYS);
      const tz =
        classroom.timeZone && classroom.timeZone.trim().length > 0
          ? classroom.timeZone
          : 'America/Los_Angeles';

      const schedules = await prisma.assignmentSchedule.findMany({
        where: { classroomId, isActive: true },
        select: {
          id: true,
          days: true,
          opensAtLocalTime: true,
          windowMinutes: true,
          numQuestions: true,
        },
        orderBy: { id: 'asc' },
      });

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
            windowMinutes: sched.windowMinutes,
            numQuestions: sched.numQuestions ?? 12,
            mode: 'SCHEDULED',
            type: 'TEST',
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

export async function POST(req: Request, { params }: RouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const classroomId = parseId(id);
    if (!classroomId) return errorResponse('Invalid classroom id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const body = await readJson(req);

    if (!body || typeof body !== 'object') {
      return errorResponse('Invalid request body', 400);
    }

    const scheduleId =
      'scheduleId' in body && typeof body.scheduleId === 'number' ? body.scheduleId : null;

    const runDate =
      'runDate' in body && typeof body.runDate === 'string' ? new Date(body.runDate) : null;

    const opensAtRaw = 'opensAt' in body ? body.opensAt : null;
    const closesAtRaw = 'closesAt' in body ? body.closesAt : null;

    if (typeof opensAtRaw !== 'string' || typeof closesAtRaw !== 'string') {
      return errorResponse('opensAt and closesAt are required', 400);
    }

    const opensAt = new Date(opensAtRaw);
    const closesAt = new Date(closesAtRaw);

    if (!isValidDate(opensAt)) return errorResponse('Invalid opensAt', 400);
    if (!isValidDate(closesAt)) return errorResponse('Invalid closesAt', 400);

    const windowMinutes =
      'windowMinutes' in body && typeof body.windowMinutes === 'number' ? body.windowMinutes : null;

    const numQuestions =
      'numQuestions' in body && typeof body.numQuestions === 'number' ? body.numQuestions : 12;

    const type =
      'type' in body &&
      (body.type === 'TEST' ||
        body.type === 'PRACTICE' ||
        body.type === 'REMEDIATION' ||
        body.type === 'PLACEMENT')
        ? (body.type as 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT')
        : 'TEST';

    const mode =
      'mode' in body && (body.mode === 'SCHEDULED' || body.mode === 'MAKEUP' || body.mode === 'MANUAL')
        ? (body.mode as 'SCHEDULED' | 'MAKEUP' | 'MANUAL')
        : scheduleId !== null
          ? 'SCHEDULED'
          : 'MANUAL';

    const questionSetId =
      'questionSetId' in body && typeof body.questionSetId === 'number' ? body.questionSetId : null;

    const studentIds =
      'studentIds' in body && Array.isArray(body.studentIds) ? body.studentIds : undefined;

    if (scheduleId !== null) {
      if (!runDate || !isValidDate(runDate)) {
        return errorResponse('runDate is required when scheduleId is provided', 400);
      }

      const dto = await createScheduledAssignment({
        classroomId,
        scheduleId,
        runDate,
        opensAt,
        closesAt,
        windowMinutes,
        numQuestions,
        type,
        mode: 'SCHEDULED',
        questionSetId,
        studentIds,
      });

      return jsonResponse({ assignment: dto }, 201);
    }

    const created = await createScheduledAssignment({
      classroomId,
      opensAt,
      closesAt,
      windowMinutes,
      numQuestions,
      type,
      mode,
      questionSetId,
      studentIds,
      scheduleId: null,
    });

    return jsonResponse({ assignment: created }, 201);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}