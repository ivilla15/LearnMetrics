import {
  getAttemptsForAssignments,
  getAttemptsForClassroomInRange,
  getMissedFactsInRange,
  getRecentAssignmentsForClassroomInRange,
  getRecentAttemptsForClassroom,
  getStudentsForClassroom,
} from '@/data/teacherProgress.repo';

import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';

import type { OperationCode } from '@/types/enums';
import { isoDay } from '@/utils/time';
import { median, percent } from '@/utils/math';
import { getLevelForOp } from '@/types';
import { bucketScore, trendFromLast3 } from './utils';

export async function getClassroomProgress(params: {
  teacherId: number;
  classroomId: number;
  days?: number;
  primaryOperation?: OperationCode;
}) {
  const classroom = await assertTeacherOwnsClassroom(params.teacherId, params.classroomId);

  const daysRaw = params.days ?? 30;
  const days = Number.isFinite(daysRaw) && daysRaw > 0 ? Math.floor(daysRaw) : 30;

  const primaryOp: OperationCode = params.primaryOperation ?? 'MUL';

  const endAt = new Date();
  const startAt = new Date(endAt.getTime() - days * 24 * 60 * 60 * 1000);

  // for streaks + last3 trend
  const recentCutoff = new Date(endAt.getTime() - 180 * 24 * 60 * 60 * 1000);

  const [students, attemptsInRange, recentAttempts, missedFacts, lastAssignments] =
    await Promise.all([
      getStudentsForClassroom(params.classroomId),
      getAttemptsForClassroomInRange({ classroomId: params.classroomId, startAt, endAt }),
      getRecentAttemptsForClassroom({ classroomId: params.classroomId, since: recentCutoff }),
      getMissedFactsInRange({ classroomId: params.classroomId, startAt, endAt, limit: 12 }),
      // last 3 TEST assignments in range (your repo currently returns assignments in range; if it doesn't filter by type,
      // do it here after fetch)
      getRecentAssignmentsForClassroomInRange({
        classroomId: params.classroomId,
        startAt,
        endAt,
        take: 3,
      }),
    ]);

  const lastAssignmentIds = lastAssignments.map((a) => a.id);

  const lastAttempts = await getAttemptsForAssignments({
    classroomId: params.classroomId,
    assignmentIds: lastAssignmentIds,
  });

  const attemptsByAssignment = new Map<number, typeof lastAttempts>();
  for (const a of lastAttempts) {
    const arr = attemptsByAssignment.get(a.assignmentId) ?? [];
    arr.push(a);
    attemptsByAssignment.set(a.assignmentId, arr);
  }

  const lastTest = lastAssignments[0] ?? null;

  const lastTestAttemptedStudentIds = new Set<number>();
  const lastTestMasteredStudentIds = new Set<number>();

  if (lastTest) {
    const attemptsForLast = attemptsByAssignment.get(lastTest.id) ?? [];
    for (const a of attemptsForLast) {
      lastTestAttemptedStudentIds.add(a.studentId);
      if (a.total > 0 && a.score === a.total) lastTestMasteredStudentIds.add(a.studentId);
    }
  }

  const last3Tests = lastAssignments.map((as) => {
    const attempts = attemptsByAssignment.get(as.id) ?? [];
    const attemptedCount = attempts.length;

    const masteryCount = attempts.reduce(
      (acc, a) => acc + (a.total > 0 && a.score === a.total ? 1 : 0),
      0,
    );

    const masteryRate = attemptedCount ? Math.round((masteryCount / attemptedCount) * 100) : 0;

    const avgPercent =
      attemptedCount > 0
        ? Math.round(
            attempts.reduce((acc, a) => acc + percent(a.score, a.total), 0) / attemptedCount,
          )
        : 0;

    const missedCount = Math.max(0, students.length - attemptedCount);

    return {
      assignmentId: as.id,
      opensAt: as.opensAt.toISOString(),
      mode: as.mode,
      numQuestions: as.numQuestions,
      attemptedCount,
      masteryRate,
      avgPercent,
      missedCount,
    };
  });

  // ---- Charts: daily ----
  const dailyMap = new Map<string, { attempts: number; mastered: number; sumPct: number }>();
  for (const a of attemptsInRange) {
    if (!a.completedAt) continue;
    const key = isoDay(a.completedAt);
    const prev = dailyMap.get(key) ?? { attempts: 0, mastered: 0, sumPct: 0 };
    prev.attempts += 1;

    const p = percent(a.score, a.total);
    prev.sumPct += p;

    if (a.total > 0 && a.score === a.total) prev.mastered += 1;

    dailyMap.set(key, prev);
  }

  const daily = Array.from(dailyMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({
      date,
      attempts: v.attempts,
      masteryRate: v.attempts > 0 ? Math.round((v.mastered / v.attempts) * 100) : 0,
      avgPercent: v.attempts > 0 ? Math.round(v.sumPct / v.attempts) : 0,
    }));

  // ---- Charts: score buckets ----
  const bucketCounts = new Map<string, number>();
  for (const a of attemptsInRange) {
    const p = percent(a.score, a.total);
    const b = bucketScore(p);
    bucketCounts.set(b, (bucketCounts.get(b) ?? 0) + 1);
  }

  const scoreBuckets = ['0-49', '50-69', '70-84', '85-99', '100'].map((label) => ({
    label,
    count: bucketCounts.get(label) ?? 0,
  }));

  // ---- Charts: level buckets (by primary op) ----
  const levelMap = new Map<number, number>();
  for (const s of students) {
    const lvl = getLevelForOp(s.progress, primaryOp);
    levelMap.set(lvl, (levelMap.get(lvl) ?? 0) + 1);
  }

  const levelBuckets = Array.from({ length: 12 }, (_, i) => i + 1).map((level) => ({
    level,
    count: levelMap.get(level) ?? 0,
  }));

  // ---- Per student grouping ----
  const rangeByStudent = new Map<number, typeof attemptsInRange>();
  for (const a of attemptsInRange) {
    const arr = rangeByStudent.get(a.studentId) ?? [];
    arr.push(a);
    rangeByStudent.set(a.studentId, arr);
  }

  const recentByStudent = new Map<number, typeof recentAttempts>();
  for (const a of recentAttempts) {
    const arr = recentByStudent.get(a.studentId) ?? [];
    arr.push(a);
    recentByStudent.set(a.studentId, arr);
  }

  const nowMs = endAt.getTime();

  const studentsRows = students.map((s) => {
    const range = rangeByStudent.get(s.id) ?? [];
    const rec = recentByStudent.get(s.id) ?? [];

    const pctsRange = range.map((a) => percent(a.score, a.total));
    const avgRange = pctsRange.length
      ? Math.round(pctsRange.reduce((x, y) => x + y, 0) / pctsRange.length)
      : 0;

    const medRange = pctsRange.length ? median(pctsRange) : 0;

    const masteredRange = range.reduce(
      (acc, a) => acc + (a.total > 0 && a.score === a.total ? 1 : 0),
      0,
    );

    const masteryRateRange = range.length ? Math.round((masteredRange / range.length) * 100) : 0;

    const last = rec[0] ?? null;
    const lastAttemptAt = last?.completedAt ? last.completedAt.toISOString() : null;
    const lastPercent = last ? percent(last.score, last.total) : null;

    const daysSinceLastAttempt = last?.completedAt
      ? Math.floor((nowMs - last.completedAt.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    let masteryStreak = 0;
    let nonMasteryStreak = 0;

    for (const a of rec) {
      const isMastery = a.total > 0 && a.score === a.total;
      if (isMastery) {
        if (nonMasteryStreak === 0) masteryStreak += 1;
        else break;
      } else {
        if (masteryStreak === 0) nonMasteryStreak += 1;
        else break;
      }
    }

    const last3 = rec.slice(0, 3).reverse();
    const last3pcts = last3.map((a) => percent(a.score, a.total));
    const trendLast3 = trendFromLast3(last3pcts);

    const noAttemptsInRange = range.length === 0;
    const stale14Days = daysSinceLastAttempt !== null ? daysSinceLastAttempt >= 14 : true;
    const nonMasteryStreak2 = nonMasteryStreak >= 2;
    const needsSetup = s.mustSetPassword;

    const atRisk =
      noAttemptsInRange || stale14Days || nonMasteryStreak2 || (range.length > 0 && medRange < 70);

    const lastTestAttempted = !!lastTest && lastTestAttemptedStudentIds.has(s.id);
    const lastTestMastery = !!lastTest && lastTestMasteredStudentIds.has(s.id);
    const missedLastTest = !!lastTest && !needsSetup && !lastTestAttemptedStudentIds.has(s.id);

    return {
      id: s.id,
      name: s.name,
      username: s.username,
      level: getLevelForOp(s.progress, primaryOp),

      mustSetPassword: s.mustSetPassword,

      attemptsInRange: range.length,
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
  });

  const attemptsTotal = attemptsInRange.length;
  const masteryTotal = attemptsInRange.reduce(
    (acc, a) => acc + (a.total > 0 && a.score === a.total ? 1 : 0),
    0,
  );

  const avgPercentAll =
    attemptsTotal > 0
      ? Math.round(
          attemptsInRange.reduce((acc, a) => acc + percent(a.score, a.total), 0) / attemptsTotal,
        )
      : 0;

  const masteryRateAll = attemptsTotal > 0 ? Math.round((masteryTotal / attemptsTotal) * 100) : 0;

  const highestLevel =
    students.length > 0
      ? Math.max(...students.map((s) => getLevelForOp(s.progress, primaryOp)))
      : null;

  const lowestRecentPercent =
    studentsRows.length && studentsRows.some((r) => r.lastPercent !== null)
      ? Math.min(...studentsRows.map((r) => (r.lastPercent === null ? 101 : r.lastPercent)))
      : null;

  const atRiskCount = studentsRows.reduce((acc, r) => acc + (r.flags.atRisk ? 1 : 0), 0);
  const noAttemptsCount = studentsRows.reduce(
    (acc, r) => acc + (r.flags.noAttemptsInRange ? 1 : 0),
    0,
  );
  const stale14DaysCount = studentsRows.reduce((acc, r) => acc + (r.flags.stale14Days ? 1 : 0), 0);
  const nonMasteryStreak2Count = studentsRows.reduce(
    (acc, r) => acc + (r.flags.nonMasteryStreak2 ? 1 : 0),
    0,
  );
  const missedLastTestCount = studentsRows.reduce(
    (acc, r) => acc + (r.flags.missedLastTest ? 1 : 0),
    0,
  );

  const topMissedFacts = missedFacts.map((m) => ({
    operation: m.operation,
    operandA: m.operandA,
    operandB: m.operandB,
    correctAnswer: m.correctAnswer,
    incorrectCount: m.incorrectCount,
    totalCount: m.totalCount,
    errorRate: m.totalCount > 0 ? Math.round((m.incorrectCount / m.totalCount) * 100) : 0,
  }));

  studentsRows.sort((a, b) => {
    if (a.flags.atRisk !== b.flags.atRisk) return a.flags.atRisk ? -1 : 1;
    if (a.medianPercentInRange !== b.medianPercentInRange)
      return a.medianPercentInRange - b.medianPercentInRange;
    const ad = a.daysSinceLastAttempt ?? 9999;
    const bd = b.daysSinceLastAttempt ?? 9999;
    return bd - ad;
  });

  return {
    classroom: { id: classroom.id, name: classroom.name },
    range: {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      days,
    },
    recent: { last3Tests },
    summary: {
      studentsTotal: students.length,

      attemptsInRange: attemptsTotal,
      masteryRateInRange: masteryRateAll,
      avgPercentInRange: avgPercentAll,

      highestLevel,
      lowestRecentPercent: lowestRecentPercent === 101 ? null : lowestRecentPercent,

      atRiskCount,
      noAttemptsCount,
      stale14DaysCount,
      nonMasteryStreak2Count,

      missedLastTestCount,
    },
    charts: {
      daily,
      scoreBuckets,
      levelBuckets,
    },
    insights: {
      topMissedFacts,
    },
    students: studentsRows,
  };
}
