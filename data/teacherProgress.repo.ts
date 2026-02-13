import { prisma } from '@/data/prisma';
import { StudentProgressLite, OperationCode } from '@/types';

export type ProgressStudentRow = {
  id: number;
  name: string;
  username: string;
  mustSetPassword: boolean;
  progress: StudentProgressLite[];
};

export type ProgressAttemptRow = {
  id: number;
  studentId: number;
  completedAt: Date | null;
  score: number;
  total: number;
};

export type MissedFactRow = {
  questionId: number;
  factorA: number;
  factorB: number;
  answer: number;
  incorrectCount: number;
  totalCount: number;
};

export type ProgressAssignmentRow = {
  id: number;
  opensAt: Date;
  closesAt: Date | null;
  windowMinutes: number | null;
  mode: 'SCHEDULED' | 'MAKEUP' | 'MANUAL';
  numQuestions: number;
  questionSetId: number | null;
  type: 'TEST' | 'PRACTICE' | 'REMEDIATION' | 'PLACEMENT';
};

export type AssignmentAttemptRow = {
  assignmentId: number;
  studentId: number;
  score: number;
  total: number;
};

function isNotNull<T>(v: T | null): v is T {
  return v !== null;
}

export async function getRecentAssignmentsForClassroomInRange(params: {
  classroomId: number;
  startAt: Date;
  endAt: Date;
  take: number;
}): Promise<ProgressAssignmentRow[]> {
  const { classroomId, startAt, endAt, take } = params;

  return prisma.assignment.findMany({
    where: {
      classroomId,
      opensAt: { gte: startAt, lt: endAt },
    },
    select: {
      id: true,
      opensAt: true,
      closesAt: true,
      windowMinutes: true,
      questionSetId: true,
      type: true,
      mode: true,
      numQuestions: true,
    },
    orderBy: { opensAt: 'desc' },
    take: Math.max(1, take),
  });
}

export async function getAttemptsForAssignments(params: {
  classroomId: number;
  assignmentIds: number[];
}): Promise<AssignmentAttemptRow[]> {
  const { classroomId, assignmentIds } = params;
  if (assignmentIds.length === 0) return [];

  return prisma.attempt.findMany({
    where: {
      assignmentId: { in: assignmentIds },
      Student: { classroomId },
    },
    select: {
      assignmentId: true,
      studentId: true,
      score: true,
      total: true,
    },
  });
}

export async function getStudentsForClassroom(classroomId: number): Promise<ProgressStudentRow[]> {
  return prisma.student.findMany({
    where: { classroomId },
    select: {
      id: true,
      name: true,
      username: true,
      mustSetPassword: true,
      progress: {
        select: {
          operation: true,
          level: true,
        },
        orderBy: { operation: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });
}

export async function getProgressForStudent(studentId: number): Promise<StudentProgressLite[]> {
  const rows = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { operation: true, level: true },
    orderBy: { operation: 'asc' },
  });

  // Prisma enum comes through as string literals compatible with OperationCode.
  return rows.map((r) => ({ operation: r.operation as OperationCode, level: r.level }));
}

export async function getAttemptsForClassroomInRange(params: {
  classroomId: number;
  startAt: Date;
  endAt: Date;
}): Promise<ProgressAttemptRow[]> {
  const { classroomId, startAt, endAt } = params;

  return prisma.attempt.findMany({
    where: {
      completedAt: { gte: startAt, lt: endAt },
      Student: { classroomId },
    },
    select: {
      id: true,
      studentId: true,
      completedAt: true,
      score: true,
      total: true,
    },
    orderBy: { completedAt: 'asc' },
  });
}

/**
 * Recent attempts for streaks + last-3 trend (bounded)
 */
export async function getRecentAttemptsForClassroom(params: {
  classroomId: number;
  since: Date;
}): Promise<ProgressAttemptRow[]> {
  const { classroomId, since } = params;

  return prisma.attempt.findMany({
    where: {
      completedAt: { gte: since },
      Student: { classroomId },
    },
    select: {
      id: true,
      studentId: true,
      completedAt: true,
      score: true,
      total: true,
    },
    orderBy: { completedAt: 'desc' },
  });
}

/**
 * AttemptItem insights:
 * top missed facts in range (incorrect vs total).
 */
export async function getMissedFactsInRange(params: {
  classroomId: number;
  startAt: Date;
  endAt: Date;
  limit: number;
}): Promise<MissedFactRow[]> {
  const { classroomId, startAt, endAt, limit } = params;

  // Count incorrect per question
  const incorrect = await prisma.attemptItem.groupBy({
    by: ['questionId'],
    where: {
      isCorrect: false,
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        Student: { classroomId },
      },
    },
    _count: { _all: true },
  });

  if (incorrect.length === 0) return [];

  const questionIds = incorrect.map((r) => r.questionId);

  // Count total per question (for error rate)
  const totals = await prisma.attemptItem.groupBy({
    by: ['questionId'],
    where: {
      questionId: { in: questionIds },
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        Student: { classroomId },
      },
    },
    _count: { _all: true },
  });

  const totalByQ = new Map<number, number>();
  for (const t of totals) totalByQ.set(t.questionId, t._count._all);

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, factorA: true, factorB: true, answer: true },
  });

  const qById = new Map<number, (typeof questions)[number]>();
  for (const q of questions) qById.set(q.id, q);

  const maybeRows = incorrect.map((r) => {
    const q = qById.get(r.questionId);
    if (!q) return null;

    const totalCount = totalByQ.get(r.questionId) ?? r._count._all;

    const row: MissedFactRow = {
      questionId: r.questionId,
      factorA: q.factorA,
      factorB: q.factorB,
      answer: q.answer,
      incorrectCount: r._count._all,
      totalCount,
    };
    return row;
  });

  const rows = maybeRows.filter(isNotNull);

  rows.sort((a, b) => {
    if (b.incorrectCount !== a.incorrectCount) return b.incorrectCount - a.incorrectCount;
    const ar = a.totalCount ? a.incorrectCount / a.totalCount : 0;
    const br = b.totalCount ? b.incorrectCount / b.totalCount : 0;
    if (br !== ar) return br - ar;
    return b.totalCount - a.totalCount;
  });

  return rows.slice(0, Math.max(1, limit));
}

/**
 * Drilldown: for one fact (questionId), show which students missed it and how often.
 * We aggregate in JS because Prisma groupBy can't group by relation fields like Attempt.studentId.
 */
export async function getMissedFactStudentBreakdownInRange(params: {
  classroomId: number;
  startAt: Date;
  endAt: Date;
  questionId: number;
}): Promise<{
  students: Array<{
    studentId: number;
    incorrectCount: number;
    totalCount: number;
    name: string;
    username: string;
  }>;
  totalIncorrect: number;
  totalCount: number;
}> {
  const { classroomId, startAt, endAt, questionId } = params;

  const items = await prisma.attemptItem.findMany({
    where: {
      questionId,
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        Student: { classroomId },
      },
    },
    select: {
      isCorrect: true,
      Attempt: {
        select: {
          studentId: true,
        },
      },
    },
  });

  if (items.length === 0) {
    return { students: [], totalIncorrect: 0, totalCount: 0 };
  }

  const agg = new Map<number, { total: number; incorrect: number }>();
  let totalIncorrect = 0;

  for (const it of items) {
    const studentId = it.Attempt.studentId;
    const prev = agg.get(studentId) ?? { total: 0, incorrect: 0 };
    prev.total += 1;
    if (!it.isCorrect) {
      prev.incorrect += 1;
      totalIncorrect += 1;
    }
    agg.set(studentId, prev);
  }

  const studentIds = Array.from(agg.keys());

  const studentRows = await prisma.student.findMany({
    where: {
      id: { in: studentIds },
      classroomId,
    },
    select: {
      id: true,
      name: true,
      username: true,
    },
  });

  const sById = new Map<number, (typeof studentRows)[number]>();
  for (const s of studentRows) sById.set(s.id, s);

  const maybeStudents = studentIds.map((studentId) => {
    const s = sById.get(studentId);
    if (!s) return null;
    const v = agg.get(studentId);
    if (!v) return null;

    return {
      studentId,
      incorrectCount: v.incorrect,
      totalCount: v.total,
      name: s.name,
      username: s.username,
    };
  });

  const students = maybeStudents.filter(isNotNull);

  students.sort((a, b) => {
    if (b.incorrectCount !== a.incorrectCount) return b.incorrectCount - a.incorrectCount;
    const ar = a.totalCount ? a.incorrectCount / a.totalCount : 0;
    const br = b.totalCount ? b.incorrectCount / b.totalCount : 0; // FIXED
    if (br !== ar) return br - ar;
    return b.totalCount - a.totalCount;
  });

  return {
    students,
    totalIncorrect,
    totalCount: items.length,
  };
}

export async function getAttemptsForStudentInRange(params: {
  classroomId: number;
  studentId: number;
  startAt: Date;
  endAt: Date;
}): Promise<ProgressAttemptRow[]> {
  const { classroomId, studentId, startAt, endAt } = params;

  return prisma.attempt.findMany({
    where: {
      completedAt: { gte: startAt, lt: endAt },
      studentId,
      Student: { classroomId },
    },
    select: {
      id: true,
      studentId: true,
      completedAt: true,
      score: true,
      total: true,
    },
    orderBy: { completedAt: 'asc' },
  });
}

export async function getRecentAttemptsForStudent(params: {
  classroomId: number;
  studentId: number;
  since: Date;
}): Promise<ProgressAttemptRow[]> {
  const { classroomId, studentId, since } = params;

  return prisma.attempt.findMany({
    where: {
      completedAt: { gte: since },
      studentId,
      Student: { classroomId },
    },
    select: {
      id: true,
      studentId: true,
      completedAt: true,
      score: true,
      total: true,
    },
    orderBy: { completedAt: 'desc' },
  });
}

export async function getMissedFactsForStudentInRange(params: {
  classroomId: number;
  studentId: number;
  startAt: Date;
  endAt: Date;
  limit: number;
}): Promise<MissedFactRow[]> {
  const { classroomId, studentId, startAt, endAt, limit } = params;

  const incorrect = await prisma.attemptItem.groupBy({
    by: ['questionId'],
    where: {
      isCorrect: false,
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        studentId,
        Student: { classroomId },
      },
    },
    _count: { _all: true },
  });

  if (incorrect.length === 0) return [];

  const questionIds = incorrect.map((r) => r.questionId);

  const totals = await prisma.attemptItem.groupBy({
    by: ['questionId'],
    where: {
      questionId: { in: questionIds },
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        studentId,
        Student: { classroomId },
      },
    },
    _count: { _all: true },
  });

  const totalByQ = new Map<number, number>();
  for (const t of totals) totalByQ.set(t.questionId, t._count._all);

  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: { id: true, factorA: true, factorB: true, answer: true },
  });

  const qById = new Map<number, (typeof questions)[number]>();
  for (const q of questions) qById.set(q.id, q);

  const maybeRows = incorrect.map((r) => {
    const q = qById.get(r.questionId);
    if (!q) return null;

    const totalCount = totalByQ.get(r.questionId) ?? r._count._all;

    const row: MissedFactRow = {
      questionId: r.questionId,
      factorA: q.factorA,
      factorB: q.factorB,
      answer: q.answer,
      incorrectCount: r._count._all,
      totalCount,
    };
    return row;
  });

  const rows = maybeRows.filter(isNotNull);

  rows.sort((a, b) => {
    if (b.incorrectCount !== a.incorrectCount) return b.incorrectCount - a.incorrectCount;
    const ar = a.totalCount ? a.incorrectCount / a.totalCount : 0;
    const br = b.totalCount ? b.incorrectCount / b.totalCount : 0;
    if (br !== ar) return br - ar;
    return b.totalCount - a.totalCount;
  });

  return rows.slice(0, Math.max(1, limit));
}
