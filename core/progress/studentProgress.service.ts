import {
  getAttemptsForAssignments,
  getAttemptsForStudentInRange,
  getMissedFactsForStudentInRange,
  getProgressForStudent,
  getRecentAssignmentsForClassroomInRange,
  getRecentAttemptsForStudent,
  getPracticeAssignmentsForStudentInRange,
} from '@/data/teacherProgress.repo';

import { findStudentById } from '@/data/students.repo';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';

import type { OperationCode } from '@/types/enums';
import { isMastery, median, percent } from '@/utils/math';
import { computeStreaks, trendFromLast3 } from './utils';
import { getLevelForOp } from '@/types';

import { getPracticeProgressForAssignment } from '@/core/practice/progress';
import { getProgressionSnapshot } from '@/core/progression/policySnapshot.service';
import { computeActiveOpAndLevel } from '@/core/progression/getStudentActiveProgress.service';
import type { PracticeProgressDTO } from '@/types';

export async function getStudentProgress(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
  days?: number;
  primaryOperation?: OperationCode;
}) {
  const classroom = await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const daysRaw = params.days ?? 30;
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.floor(daysRaw) : 30;

  const primaryOp: OperationCode = params.primaryOperation ?? 'MUL';

  const endAt = new Date();
  const startAt = new Date(endAt.getTime() - days * 24 * 60 * 60 * 1000);
  const recentCutoff = new Date(endAt.getTime() - 180 * 24 * 60 * 60 * 1000);

  const studentRow = await findStudentById(params.studentId);
  if (!studentRow || studentRow.classroomId !== params.classroomId) {
    throw new Error('Student not found');
  }

  const progressRows = await getProgressForStudent(params.studentId);

  const [attemptsInRangeRaw, recentAttemptsRaw, missedFacts, lastAssignments, practiceAssignments, snapshot] =
    await Promise.all([
      getAttemptsForStudentInRange({
        classroomId: params.classroomId,
        studentId: params.studentId,
        startAt,
        endAt,
      }),
      getRecentAttemptsForStudent({
        classroomId: params.classroomId,
        studentId: params.studentId,
        since: recentCutoff,
      }),
      getMissedFactsForStudentInRange({
        classroomId: params.classroomId,
        studentId: params.studentId,
        startAt,
        endAt,
        limit: 12,
      }),
      getRecentAssignmentsForClassroomInRange({
        classroomId: params.classroomId,
        startAt,
        endAt,
        take: 1,
      }),
      getPracticeAssignmentsForStudentInRange({
        classroomId: params.classroomId,
        studentId: params.studentId,
        startAt,
        endAt,
        take: 25,
      }),
      getProgressionSnapshot(params.classroomId),
    ]);

  const attemptsInRange = attemptsInRangeRaw.filter((a) => a.completedAt);
  const recentAttempts = recentAttemptsRaw.filter((a) => a.completedAt);

  const pctsRange = attemptsInRange.map((a) => percent(a.score, a.total));
  const avgRange = pctsRange.length
    ? Math.round(pctsRange.reduce((a, b) => a + b, 0) / pctsRange.length)
    : 0;
  const medRange = pctsRange.length ? median(pctsRange) : 0;

  const masteryRateRange = attemptsInRange.length
    ? Math.round(
        (attemptsInRange.filter((a) => isMastery(a.score, a.total)).length /
          attemptsInRange.length) *
          100,
      )
    : 0;

  const last = recentAttempts[0] ?? null;
  const lastAttemptAt = last?.completedAt ? last.completedAt.toISOString() : null;
  const lastPercent = last ? percent(last.score, last.total) : null;

  const daysSinceLastAttempt = last?.completedAt
    ? Math.floor((endAt.getTime() - last.completedAt.getTime()) / (24 * 60 * 60 * 1000))
    : null;

  const { masteryStreak, nonMasteryStreak } = computeStreaks(recentAttempts);

  const last3 = recentAttempts.slice(0, 3).reverse();
  const trendLast3 = trendFromLast3(last3.map((a) => percent(a.score, a.total)));

  const noAttemptsInRange = attemptsInRange.length === 0;
  const stale14Days = daysSinceLastAttempt !== null ? daysSinceLastAttempt >= 14 : true;
  const nonMasteryStreak2 = nonMasteryStreak >= 2;
  const needsSetup = studentRow.mustSetPassword;

  const atRisk =
    noAttemptsInRange ||
    stale14Days ||
    nonMasteryStreak2 ||
    (attemptsInRange.length > 0 && medRange < 70);

  let missedLastTest = false;
  let lastTestAttempted = false;
  let lastTestMastery = false;

  const lastTest = lastAssignments[0] ?? null;

  if (lastTest && !needsSetup) {
    const attemptsForLast = await getAttemptsForAssignments({
      classroomId: params.classroomId,
      assignmentIds: [lastTest.id],
    });

    missedLastTest = !attemptsForLast.some((a) => a.studentId === params.studentId);

    const attemptForStudent = attemptsForLast.find((a) => a.studentId === params.studentId);
    if (attemptForStudent) {
      lastTestAttempted = true;
      lastTestMastery = isMastery(attemptForStudent.score, attemptForStudent.total);
    }
  }

  const level = getLevelForOp(progressRows, primaryOp);
  const active = computeActiveOpAndLevel({ progress: progressRows, snapshot });

  const student = {
    id: studentRow.id,
    name: studentRow.name,
    username: studentRow.username,
    level,
    mustSetPassword: studentRow.mustSetPassword,
    operationLevels: progressRows.map((p) => ({ operation: p.operation, level: p.level })),
    activeOperation: active.operation,
    activeLevel: active.level,

    attemptsInRange: attemptsInRange.length,
    masteryRateInRange: masteryRateRange,
    avgPercentInRange: avgRange,
    medianPercentInRange: medRange,
    lastAttemptAt,
    lastPercent,

    masteryStreak,
    nonMasteryStreak,
    trendLast3,
    daysSinceLastAttempt,

    flags: {
      atRisk,
      noAttemptsInRange,
      stale14Days,
      nonMasteryStreak2,
      needsSetup,
      missedLastTest,
      lastTestAttempted,
      lastTestMastery,
    },
  };

  const recent = recentAttempts.slice(0, 20).map((a) => {
    const pct = percent(a.score, a.total);
    return {
      id: a.id,
      completedAt: a.completedAt!.toISOString(),
      score: a.score,
      total: a.total,
      percent: pct,
      mastered: isMastery(a.score, a.total),
      missedCount: Math.max(0, a.total - a.score),
    };
  });

  const topMissedFacts = missedFacts.map((m) => ({
    operation: m.operation,
    operandA: m.operandA,
    operandB: m.operandB,
    correctAnswer: m.correctAnswer,
    incorrectCount: m.incorrectCount,
    totalCount: m.totalCount,
    errorRate: m.totalCount > 0 ? Math.round((m.incorrectCount / m.totalCount) * 100) : 0,
  }));

  let practice: {
    summary: { requiredSets: number; completedSets: number; percent: number } | null;
    rows: PracticeProgressDTO[];
  } | null = null;

  if (practiceAssignments.length > 0) {
    const rows = await Promise.all(
      practiceAssignments.map((a) =>
        getPracticeProgressForAssignment({ studentId: params.studentId, assignmentId: a.id }),
      ),
    );

    const totalRequired = rows.reduce((acc, r) => acc + (r.requiredSets ?? 0), 0);
    const totalCompleted = rows.reduce((acc, r) => acc + (r.completedSets ?? 0), 0);

    const pct =
      totalRequired <= 0
        ? 0
        : Math.min(100, Math.round((totalCompleted / totalRequired) * 100));

    practice = {
      summary: rows.length
        ? {
            requiredSets: totalRequired,
            completedSets: totalCompleted,
            percent: pct,
          }
        : null,
      rows,
    };
  }

  return {
    classroom: { id: classroom.id, name: classroom.name },
    range: {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      days,
    },
    student,
    practice,
    insights: { topMissedFacts },
    recent: { attempts: recent },
  };
}
