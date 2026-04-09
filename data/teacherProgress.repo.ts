import { prisma } from '@/data/prisma';
import type { OperationCode } from '@/types/enums';
import { parseOperandValue, parseAnswerValue, extractNumericValue } from '@/types';

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

export async function getOperationCountsForClassroomInRange(params: {
  classroomId: number;
  startAt: Date;
  endAt: Date;
}) {
  const { classroomId, startAt, endAt } = params;

  return prisma.attemptItem.groupBy({
    by: ['operation'],
    where: {
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        Student: { classroomId },
      },
    },
    _count: { operation: true },
  });
}

export async function getMissedFactsInRange(params: {
  classroomId: number;
  startAt: Date;
  endAt: Date;
  limit: number;
}) {
  const { classroomId, startAt, endAt, limit } = params;

  // Fetch all incorrect attempt items in range (can't use groupBy on JSON fields efficiently)
  const incorrectItems = await prisma.attemptItem.findMany({
    where: {
      isCorrect: false,
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        Student: { classroomId },
      },
    },
    select: {
      operation: true,
      operandAValue: true,
      operandBValue: true,
      correctAnswerValue: true,
    },
  });

  if (incorrectItems.length === 0) return [];

  // Fetch all attempt items (incorrect or not) for totals
  const allItems = await prisma.attemptItem.findMany({
    where: {
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        Student: { classroomId },
      },
    },
    select: {
      operation: true,
      operandAValue: true,
      operandBValue: true,
      correctAnswerValue: true,
    },
  });

  // Group in memory
  const incorrectByKey = new Map<string, number>();
  for (const item of incorrectItems) {
    const operandA = extractNumericValue(parseOperandValue(item.operandAValue));
    const operandB = extractNumericValue(parseOperandValue(item.operandBValue));
    const correctAnswer = extractNumericValue(parseAnswerValue(item.correctAnswerValue));
    const k = keyForFact({
      operation: item.operation as OperationCode,
      operandA,
      operandB,
      correctAnswer,
    });
    incorrectByKey.set(k, (incorrectByKey.get(k) ?? 0) + 1);
  }

  const totalByKey = new Map<string, number>();
  for (const item of allItems) {
    const operandA = extractNumericValue(parseOperandValue(item.operandAValue));
    const operandB = extractNumericValue(parseOperandValue(item.operandBValue));
    const correctAnswer = extractNumericValue(parseAnswerValue(item.correctAnswerValue));
    const k = keyForFact({
      operation: item.operation as OperationCode,
      operandA,
      operandB,
      correctAnswer,
    });
    totalByKey.set(k, (totalByKey.get(k) ?? 0) + 1);
  }

  const rows = Array.from(incorrectByKey.entries())
    .map(([k, incorrectCount]) => {
      const totalCount = totalByKey.get(k) ?? incorrectCount;
      const parts = k.split('|');
      return {
        operation: parts[0] as OperationCode,
        operandA: Number(parts[1]),
        operandB: Number(parts[2]),
        correctAnswer: Number(parts[3]),
        incorrectCount,
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

  // Fetch all incorrect attempt items in range
  const incorrectItems = await prisma.attemptItem.findMany({
    where: {
      isCorrect: false,
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        studentId,
        Student: { classroomId },
      },
    },
    select: {
      operation: true,
      operandAValue: true,
      operandBValue: true,
      correctAnswerValue: true,
    },
  });

  if (incorrectItems.length === 0) return [];

  // Fetch all attempt items (incorrect or not) for totals
  const allItems = await prisma.attemptItem.findMany({
    where: {
      Attempt: {
        completedAt: { gte: startAt, lt: endAt },
        studentId,
        Student: { classroomId },
      },
    },
    select: {
      operation: true,
      operandAValue: true,
      operandBValue: true,
      correctAnswerValue: true,
    },
  });

  // Group in memory
  const incorrectByKey = new Map<string, number>();
  for (const item of incorrectItems) {
    const operandA = extractNumericValue(parseOperandValue(item.operandAValue));
    const operandB = extractNumericValue(parseOperandValue(item.operandBValue));
    const correctAnswer = extractNumericValue(parseAnswerValue(item.correctAnswerValue));
    const k = keyForFact({
      operation: item.operation as OperationCode,
      operandA,
      operandB,
      correctAnswer,
    });
    incorrectByKey.set(k, (incorrectByKey.get(k) ?? 0) + 1);
  }

  const totalByKey = new Map<string, number>();
  for (const item of allItems) {
    const operandA = extractNumericValue(parseOperandValue(item.operandAValue));
    const operandB = extractNumericValue(parseOperandValue(item.operandBValue));
    const correctAnswer = extractNumericValue(parseAnswerValue(item.correctAnswerValue));
    const k = keyForFact({
      operation: item.operation as OperationCode,
      operandA,
      operandB,
      correctAnswer,
    });
    totalByKey.set(k, (totalByKey.get(k) ?? 0) + 1);
  }

  return Array.from(incorrectByKey.entries())
    .map(([k, incorrectCount]) => {
      const totalCount = totalByKey.get(k) ?? incorrectCount;
      const parts = k.split('|');
      return {
        operation: parts[0] as OperationCode,
        operandA: Number(parts[1]),
        operandB: Number(parts[2]),
        correctAnswer: Number(parts[3]),
        incorrectCount,
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

export async function getPracticeAssignmentsForStudentInRange(params: {
  classroomId: number;
  studentId: number;
  startAt: Date;
  endAt: Date;
  take?: number;
}) {
  const { classroomId, studentId, startAt, endAt, take = 25 } = params;

  return prisma.assignment.findMany({
    where: {
      classroomId,
      targetKind: 'PRACTICE_TIME',
      opensAt: { gte: startAt, lte: endAt },
      recipients: { some: { studentId } },
    },
    select: { id: true },
    orderBy: { opensAt: 'desc' },
    take,
  });
}
