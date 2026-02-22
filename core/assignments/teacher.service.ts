import { prisma } from '@/data/prisma';
import type { Prisma } from '@prisma/client';

import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import { clampTake, parseCursor, percent } from '@/utils';

import type {
  AssignModalBootstrapResponse,
  AssignModalStudentRowDTO,
  TeacherAssignmentAttemptsResponse,
  TeacherAssignmentAttemptRowDTO,
  TeacherAssignmentListItemDTO,
  TeacherAssignmentsListResponse,
  TeacherAttemptDetailResponse,
  TeacherAttemptDetailItemDTO,
} from '@/types';

import type {
  AssignmentAttemptsFilter,
  AssignmentModeFilter,
  AssignmentStatusFilter,
  AssignmentTypeFilter,
} from '@/types';

import type {
  AssignmentTargetKind,
  OperationCode,
  AssignmentMode,
  AssignmentType,
} from '@/types/enums';

export async function listTeacherAssignmentsForClassroom(params: {
  teacherId: number;
  classroomId: number;
  cursor?: string | null;
  take?: number;
  status?: AssignmentStatusFilter;
  mode?: AssignmentModeFilter;
  type?: AssignmentTypeFilter;
}): Promise<TeacherAssignmentsListResponse> {
  const cursorId = parseCursor(params.cursor ?? null);
  const take = clampTake(params.take ?? 20, 20, 50);

  const status = params.status ?? 'all';
  const mode = params.mode ?? 'all';
  const type = params.type ?? 'all';

  const classroom = await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);
  const now = new Date();

  const where: Prisma.AssignmentWhereInput = { classroomId: params.classroomId };

  if (mode !== 'all') where.mode = mode as AssignmentMode;
  if (type !== 'all') where.type = type as AssignmentType;

  if (status === 'open') {
    where.opensAt = { lte: now };
    where.OR = [{ closesAt: null }, { closesAt: { gt: now } }];
  } else if (status === 'finished') {
    where.AND = [{ closesAt: { not: null } }, { closesAt: { lte: now } }];
  } else if (status === 'upcoming') {
    where.opensAt = { gt: now };
  }

  const rowsRaw = await prisma.assignment.findMany({
    where,
    orderBy: [{ opensAt: 'desc' }, { id: 'desc' }],
    take: take + 1,
    ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
    select: {
      id: true,
      type: true,
      mode: true,
      targetKind: true,
      operation: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      numQuestions: true,
      durationMinutes: true,
      scheduleId: true,
      runDate: true,
    },
  });

  const page = rowsRaw.slice(0, take);
  const hasMore = rowsRaw.length > take;
  const nextCursor = hasMore && page.length > 0 ? String(page[page.length - 1].id) : null;

  const totalStudents = await prisma.student.count({ where: { classroomId: params.classroomId } });

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
    s.sumPercent += percent(a.score, a.total);
    s.total += 1;
    if (a.total > 0 && a.score === a.total) s.masteryCount += 1;

    statsByAssignment.set(a.assignmentId, s);
  }

  const rows: TeacherAssignmentListItemDTO[] = page.map((a) => {
    const s = statsByAssignment.get(a.id) ?? {
      attemptedCount: 0,
      masteryCount: 0,
      sumPercent: 0,
      total: 0,
    };

    const opensMs = a.opensAt.getTime();
    const closesMs = a.closesAt ? a.closesAt.getTime() : null;
    const nowMs = now.getTime();

    const derivedStatus =
      opensMs > nowMs ? 'UPCOMING' : closesMs !== null && closesMs <= nowMs ? 'FINISHED' : 'OPEN';

    const avgPercent = s.total > 0 ? Math.round(s.sumPercent / s.total) : 0;
    const masteryRate = s.total > 0 ? Math.round((s.masteryCount / s.total) * 100) : 0;

    return {
      assignmentId: a.id,
      type: a.type,
      mode: a.mode,
      targetKind: a.targetKind as AssignmentTargetKind,
      operation: (a.operation ?? null) as OperationCode | null,

      status: derivedStatus,
      opensAt: a.opensAt.toISOString(),
      closesAt: a.closesAt ? a.closesAt.toISOString() : null,

      windowMinutes: a.windowMinutes ?? null,
      numQuestions: a.numQuestions ?? 12,
      durationMinutes: a.durationMinutes ?? null,

      scheduleId: a.scheduleId ?? null,
      runDate: a.runDate ? a.runDate.toISOString() : null,

      stats: {
        attemptedCount: s.attemptedCount,
        totalStudents,
        masteryRate: derivedStatus === 'FINISHED' ? masteryRate : null,
        avgPercent: derivedStatus === 'FINISHED' ? avgPercent : null,
      },
    };
  });

  return {
    classroom: { id: classroom.id, name: classroom.name, timeZone: classroom.timeZone },
    rows,
    nextCursor,
    projections: undefined,
  };
}

export async function getAssignModalBootstrap(params: {
  teacherId: number;
  classroomId: number;
}): Promise<AssignModalBootstrapResponse> {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const students = await prisma.student.findMany({
    where: { classroomId: params.classroomId },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    select: { id: true, name: true, username: true, mustSetPassword: true },
  });

  const studentRows: AssignModalStudentRowDTO[] = students.map((s) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    flags: { needsSetup: s.mustSetPassword },
  }));

  const last3Tests = await prisma.assignment.findMany({
    where: { classroomId: params.classroomId, type: 'TEST' },
    orderBy: [{ opensAt: 'desc' }, { id: 'desc' }],
    take: 3,
    select: { numQuestions: true },
  });

  return {
    students: studentRows,
    recent: { last3Tests: last3Tests.map((t) => ({ numQuestions: t.numQuestions ?? 12 })) },
  };
}

export async function listTeacherAssignmentAttempts(params: {
  teacherId: number;
  classroomId: number;
  assignmentId: number;
  filter?: AssignmentAttemptsFilter;
}): Promise<TeacherAssignmentAttemptsResponse> {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const assignment = await prisma.assignment.findFirst({
    where: { id: params.assignmentId, classroomId: params.classroomId },
    select: {
      id: true,
      classroomId: true,
      type: true,
      mode: true,
      targetKind: true,
      operation: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      numQuestions: true,
      durationMinutes: true,
      recipients: { select: { studentId: true } },
    },
  });

  if (!assignment) {
    throw new Error('Assignment not found');
  }

  const targetedIds = assignment.recipients.map((r) => r.studentId);

  const students = targetedIds.length
    ? await prisma.student.findMany({
        where: { id: { in: targetedIds }, classroomId: params.classroomId },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, username: true },
      })
    : await prisma.student.findMany({
        where: { classroomId: params.classroomId },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        select: { id: true, name: true, username: true },
      });

  const attempts = await prisma.attempt.findMany({
    where: { assignmentId: assignment.id },
    select: {
      id: true,
      studentId: true,
      completedAt: true,
      score: true,
      total: true,
      levelAtTime: true,
    },
  });

  const attemptByStudent = new Map<number, (typeof attempts)[number]>();
  for (const a of attempts) attemptByStudent.set(a.studentId, a);

  let rows: TeacherAssignmentAttemptRowDTO[] = students.map((s) => {
    const a = attemptByStudent.get(s.id) ?? null;

    const p = a ? percent(a.score, a.total) : null;
    const missed = a ? Math.max(0, a.total - a.score) : null;
    const wasMastery = a ? a.total > 0 && a.score === a.total : null;

    return {
      studentId: s.id,
      name: s.name,
      username: s.username,

      attemptId: a?.id ?? null,
      completedAt: a?.completedAt ? a.completedAt.toISOString() : null,

      score: a?.score ?? null,
      total: a?.total ?? null,
      percent: p,
      missed,

      wasMastery,
      levelAtTime: a?.levelAtTime ?? null,
    };
  });

  const filter = params.filter ?? 'ALL';

  if (filter === 'MISSING') {
    rows = rows.filter((r) => r.attemptId === null);
  } else if (filter === 'MASTERY') {
    rows = rows.filter((r) => r.wasMastery === true);
  } else if (filter === 'NOT_MASTERY') {
    rows = rows.filter((r) => r.attemptId !== null && r.wasMastery === false);
  } else {
    rows.sort((a, b) => {
      const aHas = a.attemptId ? 1 : 0;
      const bHas = b.attemptId ? 1 : 0;
      if (aHas !== bHas) return bHas - aHas;
      const ad = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bd = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bd - ad;
    });
  }

  return {
    assignment: {
      assignmentId: assignment.id,
      type: assignment.type,
      mode: assignment.mode,
      targetKind: assignment.targetKind as AssignmentTargetKind,
      operation: (assignment.operation ?? null) as OperationCode | null,

      opensAt: assignment.opensAt.toISOString(),
      closesAt: assignment.closesAt ? assignment.closesAt.toISOString() : null,

      windowMinutes: assignment.windowMinutes ?? null,
      numQuestions: assignment.numQuestions ?? 12,
      durationMinutes: assignment.durationMinutes ?? null,
    },
    rows,
  };
}

export async function getTeacherAttemptDetail(params: {
  teacherId: number;
  classroomId: number;
  attemptId: number;
}): Promise<TeacherAttemptDetailResponse> {
  await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const attempt = await prisma.attempt.findFirst({
    where: { id: params.attemptId },
    select: {
      id: true,
      score: true,
      total: true,
      completedAt: true,
      Student: { select: { id: true, classroomId: true, name: true, username: true } },
      Assignment: {
        select: {
          id: true,
          classroomId: true,
          type: true,
          mode: true,
          targetKind: true,
          operation: true,
          opensAt: true,
          closesAt: true,
          windowMinutes: true,
          numQuestions: true,
          durationMinutes: true,
        },
      },
      AttemptItem: {
        select: {
          id: true,
          operation: true,
          operandA: true,
          operandB: true,
          correctAnswer: true,
          givenAnswer: true,
          isCorrect: true,
        },
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!attempt) throw new Error('Attempt not found');

  if (
    attempt.Student.classroomId !== params.classroomId ||
    attempt.Assignment.classroomId !== params.classroomId
  ) {
    throw new Error('Not allowed');
  }

  const p = percent(attempt.score, attempt.total);
  const wasMastery = attempt.total > 0 && attempt.score === attempt.total;

  const items: TeacherAttemptDetailItemDTO[] = attempt.AttemptItem.map((it) => ({
    id: it.id,
    operation: it.operation as OperationCode,
    operandA: it.operandA,
    operandB: it.operandB,
    correctAnswer: it.correctAnswer,
    studentAnswer: it.givenAnswer,
    isCorrect: it.isCorrect,
  }));

  return {
    attemptId: attempt.id,
    completedAt: attempt.completedAt ? attempt.completedAt.toISOString() : null,
    score: attempt.score,
    total: attempt.total,
    percent: p,
    wasMastery,
    student: {
      id: attempt.Student.id,
      name: attempt.Student.name,
      username: attempt.Student.username,
    },
    assignment: {
      assignmentId: attempt.Assignment.id,
      type: attempt.Assignment.type,
      mode: attempt.Assignment.mode,
      targetKind: attempt.Assignment.targetKind as AssignmentTargetKind,
      operation: (attempt.Assignment.operation ?? null) as OperationCode | null,

      opensAt: attempt.Assignment.opensAt.toISOString(),
      closesAt: attempt.Assignment.closesAt ? attempt.Assignment.closesAt.toISOString() : null,

      windowMinutes: attempt.Assignment.windowMinutes ?? null,
      numQuestions: attempt.Assignment.numQuestions ?? 12,
      durationMinutes: attempt.Assignment.durationMinutes ?? null,
    },
    items,
  };
}
