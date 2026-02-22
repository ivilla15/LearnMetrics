import { prisma } from '@/data/prisma';
import type { OperationCode } from '@/types/enums';

function keyForFact(fact: {
  operation: OperationCode;
  operandA: number;
  operandB: number;
  correctAnswer: number;
}): string {
  return `${fact.operation}|${fact.operandA}|${fact.operandB}|${fact.correctAnswer}`;
}

export async function getRecentAssignmentsForClassroomInRange(params: {
  classroomId: number;
  startAt: Date;
  endAt: Date;
  take: number;
}) {
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

      mode: true,
      type: true,
      targetKind: true,

      operation: true,
      numQuestions: true,
      durationMinutes: true,
    },
    orderBy: [{ opensAt: 'desc' }, { id: 'desc' }],
    take: Math.max(1, take),
  });
}

export async function getAttemptsForAssignments(params: {
  classroomId: number;
  assignmentIds: number[];
}) {
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

export async function getStudentsForClassroom(classroomId: number) {
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

export async function getProgressForStudent(
  studentId: number,
): Promise<Array<{ operation: OperationCode; level: number }>> {
  const rows = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { operation: true, level: true },
    orderBy: { operation: 'asc' },
  });

  return rows.map((r) => ({ operation: r.operation as OperationCode, level: r.level }));
}

export async function getAttemptsForClassroomInRange(params: {
  classroomId: number;
  startAt: Date;
  endAt: Date;
}) {
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

export async function getRecentAttemptsForClassroom(params: { classroomId: number; since: Date }) {
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

export async function getMissedFactsInRange(params: {
  classroomId: number;
  startAt: Date;
  endAt: Date;
  limit: number;
}) {
  const { classroomId, startAt, endAt, limit } = params;

  const incorrect = await prisma.attemptItem.groupBy({
    by: ['operation', 'operandA', 'operandB', 'correctAnswer'],
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

  const totals = await prisma.attemptItem.groupBy({
    by: ['operation', 'operandA', 'operandB', 'correctAnswer'],
    where: {
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        Student: { classroomId },
      },
    },
    _count: { _all: true },
  });

  const totalByKey = new Map<string, number>();
  for (const t of totals) {
    const k = keyForFact({
      operation: t.operation as OperationCode,
      operandA: t.operandA,
      operandB: t.operandB,
      correctAnswer: t.correctAnswer,
    });
    totalByKey.set(k, t._count._all);
  }

  const rows = incorrect
    .map((r) => {
      const k = keyForFact({
        operation: r.operation as OperationCode,
        operandA: r.operandA,
        operandB: r.operandB,
        correctAnswer: r.correctAnswer,
      });

      const totalCount = totalByKey.get(k) ?? r._count._all;

      return {
        operation: r.operation as OperationCode,
        operandA: r.operandA,
        operandB: r.operandB,
        correctAnswer: r.correctAnswer,
        incorrectCount: r._count._all,
        totalCount,
      };
    })
    .sort((a, b) => {
      if (b.incorrectCount !== a.incorrectCount) return b.incorrectCount - a.incorrectCount;

      const ar = a.totalCount > 0 ? a.incorrectCount / a.totalCount : 0;
      const br = b.totalCount > 0 ? b.incorrectCount / b.totalCount : 0;
      if (br !== ar) return br - ar;

      return b.totalCount - a.totalCount;
    })
    .slice(0, Math.max(1, limit));

  return rows;
}

export async function getAttemptsForStudentInRange(params: {
  classroomId: number;
  studentId: number;
  startAt: Date;
  endAt: Date;
}) {
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
}) {
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
}) {
  const { classroomId, studentId, startAt, endAt, limit } = params;

  const incorrect = await prisma.attemptItem.groupBy({
    by: ['operation', 'operandA', 'operandB', 'correctAnswer'],
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

  const totals = await prisma.attemptItem.groupBy({
    by: ['operation', 'operandA', 'operandB', 'correctAnswer'],
    where: {
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        studentId,
        Student: { classroomId },
      },
    },
    _count: { _all: true },
  });

  const totalByKey = new Map<string, number>();
  for (const t of totals) {
    const k = keyForFact({
      operation: t.operation as OperationCode,
      operandA: t.operandA,
      operandB: t.operandB,
      correctAnswer: t.correctAnswer,
    });
    totalByKey.set(k, t._count._all);
  }

  return incorrect
    .map((r) => {
      const k = keyForFact({
        operation: r.operation as OperationCode,
        operandA: r.operandA,
        operandB: r.operandB,
        correctAnswer: r.correctAnswer,
      });

      const totalCount = totalByKey.get(k) ?? r._count._all;

      return {
        operation: r.operation as OperationCode,
        operandA: r.operandA,
        operandB: r.operandB,
        correctAnswer: r.correctAnswer,
        incorrectCount: r._count._all,
        totalCount,
      };
    })
    .sort((a, b) => {
      if (b.incorrectCount !== a.incorrectCount) return b.incorrectCount - a.incorrectCount;

      const ar = a.totalCount > 0 ? a.incorrectCount / a.totalCount : 0;
      const br = b.totalCount > 0 ? b.incorrectCount / b.totalCount : 0;
      if (br !== ar) return br - ar;

      return b.totalCount - a.totalCount;
    })
    .slice(0, Math.max(1, limit));
}
