import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core';

import type {
  AttemptRowDTO,
  StudentAssignmentsListResponse,
  StudentAssignmentListItemDTO,
} from '@/types';

import type { OperationCode } from '@/types/enums';

import { clampTake, percent, getStatus } from '@/utils';

export async function GET(req: Request) {
  const auth = await requireStudent();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const url = new URL(req.url);
  const scopeParam = (url.searchParams.get('scope') ?? 'all').toLowerCase();
  const scope: 'today' | 'all' = scopeParam === 'today' ? 'today' : 'all';

  const limit = clampTake(url.searchParams.get('limit'), 20, 50);
  const cursorStr = url.searchParams.get('cursor');
  const cursor = cursorStr ? Number(cursorStr) : null;
  const scheduleIdStr = url.searchParams.get('scheduleId');
  const scheduleId = scheduleIdStr ? Number(scheduleIdStr) : null;

  const runDate = url.searchParams.get('runDate');

  const now = new Date();
  const student = auth.student;

  const classroom = await prisma.classroom.findUnique({
    where: { id: student.classroomId },
    select: { id: true, name: true, timeZone: true },
  });

  if (!classroom) {
    return NextResponse.json({ error: 'Classroom not found.' }, { status: 404 });
  }

  const whereBase: Prisma.AssignmentWhereInput = {
    classroomId: classroom.id,
  };

  if (scheduleId && Number.isFinite(scheduleId) && scheduleId > 0) {
    whereBase.scheduleId = scheduleId;
  }

  if (runDate && /^\d{4}-\d{2}-\d{2}$/.test(runDate)) {
    whereBase.runDate = new Date(`${runDate}T00:00:00.000Z`);
  }

  // "today" = currently open assignments
  const where: Prisma.AssignmentWhereInput =
    scope === 'today'
      ? {
          ...whereBase,
          opensAt: { lte: now },
          OR: [{ closesAt: null }, { closesAt: { gte: now } }],
        }
      : whereBase;

  const assignments = await prisma.assignment.findMany({
    where,
    orderBy: [{ opensAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    ...(cursor
      ? {
          cursor: { id: cursor },
          skip: 1,
        }
      : {}),
    select: {
      id: true,
      type: true,
      mode: true,
      targetKind: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      numQuestions: true,
      durationMinutes: true,
      requiredSets: true,
      minimumScorePercent: true,
      scheduleId: true,
      runDate: true,
    },
  });

  const hasMore = assignments.length > limit;
  const page = hasMore ? assignments.slice(0, limit) : assignments;
  const nextCursor = hasMore ? String(page[page.length - 1]!.id) : null;

  if (page.length === 0) {
    const empty: StudentAssignmentsListResponse = {
      classroom,
      rows: [],
      nextCursor: null,
    };
    return NextResponse.json(empty);
  }

  const assignmentIds = page.map((a) => a.id);

  const attempts = await prisma.attempt.findMany({
    where: {
      studentId: student.id,
      assignmentId: { in: assignmentIds },
      completedAt: { not: null },
    },
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
  });

  const latestByAssignment = new Map<number, AttemptRowDTO>();

  for (const a of attempts) {
    if (!a.completedAt) continue;

    const operation: OperationCode | null = a.operationAtTime as OperationCode | null;

    if (!operation) continue;
    if (typeof a.levelAtTime !== 'number') continue;

    const pct = percent(a.score, a.total);

    latestByAssignment.set(a.assignmentId, {
      attemptId: a.id,
      assignmentId: a.assignmentId,
      completedAt: a.completedAt.toISOString(),
      type: a.Assignment.type,
      mode: a.Assignment.mode,
      operation,
      levelAtTime: a.levelAtTime,
      score: a.score,
      total: a.total,
      percent: pct,
      wasMastery: pct === 100,
    });
  }

  const rows: StudentAssignmentListItemDTO[] = page.map((a) => {
    const statusRaw = getStatus({
      opensAt: a.opensAt,
      closesAt: a.closesAt,
      now,
    });

    // Map to your student status union
    const status: StudentAssignmentListItemDTO['status'] =
      statusRaw === 'OPEN' ? 'OPEN' : statusRaw === 'NOT_OPEN' ? 'UPCOMING' : 'FINISHED';

    return {
      assignmentId: a.id,
      type: a.type,
      mode: a.mode,
      targetKind: a.targetKind,
      status,
      opensAt: a.opensAt.toISOString(),
      closesAt: a.closesAt ? a.closesAt.toISOString() : null,
      windowMinutes: a.windowMinutes,
      numQuestions: a.numQuestions,
      durationMinutes: a.durationMinutes,
      requiredSets: a.requiredSets ?? null,
      minimumScorePercent: a.minimumScorePercent ?? null,
      scheduleId: a.scheduleId,
      runDate: a.runDate ? a.runDate.toISOString().slice(0, 10) : null,
      latestAttempt: latestByAssignment.get(a.id) ?? null,
    };
  });

  const payload: StudentAssignmentsListResponse = {
    classroom,
    rows,
    nextCursor,
  };

  return NextResponse.json(payload);
}
