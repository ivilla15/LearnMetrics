import * as StudentsRepo from '@/data';
import * as ProgressRepo from '@/data/';
import { NotFoundError } from '@/core/errors';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import { percent, median } from '@/utils';
import { trendFromLast3 } from './utils';

import type { MissedFact, ProgressRange, StudentProgressRow } from './service';
import { getLevelForOp } from '@/types';

export type StudentAttemptItem = {
  id: number;
  completedAt: string;
  score: number;
  total: number;
  percent: number;
  mastered: boolean;
  missedCount: number;
};

export type TeacherStudentProgressDTO = {
  classroom: { id: number; name: string };
  student: StudentProgressRow;
  range: ProgressRange;
  insights: { topMissedFacts: MissedFact[] };
  recent: { attempts: StudentAttemptItem[] };
};

export async function getTeacherStudentProgress(params: {
  teacherId: number;
  classroomId: number;
  studentId: number;
  days?: number;
}): Promise<TeacherStudentProgressDTO> {
  const { teacherId, classroomId, studentId } = params;

  const classroom = await assertTeacherOwnsClassroom(teacherId, classroomId);

  const days = Number.isFinite(params.days) && params.days! > 0 ? params.days! : 30;

  const endAt = new Date();
  const startAt = new Date(endAt.getTime() - days * 24 * 60 * 60 * 1000);

  const recentCutoff = new Date(endAt.getTime() - 180 * 24 * 60 * 60 * 1000);

  const studentRow = await StudentsRepo.findStudentById(studentId);
  if (!studentRow || studentRow.classroomId !== classroomId) {
    throw new NotFoundError('Student not found');
  }

  // Fetch progress rows for this student (operation + level)
  const progressRows = await ProgressRepo.getProgressForStudent(studentId);

  const [attemptsInRangeRaw, recentAttemptsRaw, missedFacts, lastAssignments] = await Promise.all([
    ProgressRepo.getAttemptsForStudentInRange({ classroomId, studentId, startAt, endAt }),
    ProgressRepo.getRecentAttemptsForStudent({ classroomId, studentId, since: recentCutoff }),
    ProgressRepo.getMissedFactsForStudentInRange({
      classroomId,
      studentId,
      startAt,
      endAt,
      limit: 12,
    }),
    ProgressRepo.getRecentAssignmentsForClassroomInRange({
      classroomId,
      startAt,
      endAt,
      take: 1,
    }),
  ]);

  // completedAt is nullable now; these queries should naturally exclude nulls,
  // but TS types still allow null, so we filter defensively.
  const attemptsInRange = attemptsInRangeRaw.filter((a) => a.completedAt);
  const recentAttempts = recentAttemptsRaw.filter((a) => a.completedAt);

  // ---------- Range stats ----------
  const pctsRange = attemptsInRange.map((a) => percent(a.score, a.total));
  const avgRange = pctsRange.length
    ? Math.round(pctsRange.reduce((a, b) => a + b, 0) / pctsRange.length)
    : 0;
  const medRange = pctsRange.length ? median(pctsRange) : 0;

  const masteryRateRange = attemptsInRange.length
    ? Math.round(
        (attemptsInRange.filter((a) => a.total > 0 && a.score === a.total).length /
          attemptsInRange.length) *
          100,
      )
    : 0;

  // ---------- Recent stats ----------
  const last = recentAttempts[0] ?? null;
  const lastAttemptAt = last && last.completedAt ? last.completedAt.toISOString() : null;
  const lastPercent = last ? percent(last.score, last.total) : null;

  const daysSinceLastAttempt =
    last && last.completedAt
      ? Math.floor((endAt.getTime() - last.completedAt.getTime()) / (24 * 60 * 60 * 1000))
      : null;

  let masteryStreak = 0;
  let nonMasteryStreak = 0;

  for (const a of recentAttempts) {
    const isMastery = a.total > 0 && a.score === a.total;
    if (isMastery) {
      if (nonMasteryStreak === 0) masteryStreak++;
      else break;
    } else {
      if (masteryStreak === 0) nonMasteryStreak++;
      else break;
    }
  }

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

  // ---------- Missed last test ----------
  let missedLastTest = false;
  let lastTestAttempted = false;
  let lastTestMastery = false;

  const lastTest = lastAssignments[0] ?? null;
  if (lastTest && !needsSetup) {
    const attemptsForLast = await ProgressRepo.getAttemptsForAssignments({
      classroomId,
      assignmentIds: [lastTest.id],
    });

    missedLastTest = !attemptsForLast.some((a) => a.studentId === studentId);

    const attemptForStudent = attemptsForLast.find((a) => a.studentId === studentId);
    if (attemptForStudent) {
      lastTestAttempted = true;
      lastTestMastery =
        attemptForStudent.total > 0 && attemptForStudent.score === attemptForStudent.total;
    }
  }

  const mulLevel = getLevelForOp(progressRows, 'MUL');

  const student: StudentProgressRow = {
    id: studentRow.id,
    name: studentRow.name,
    username: studentRow.username,
    // NEW: provide MUL level from StudentProgress
    level: mulLevel,
    mustSetPassword: studentRow.mustSetPassword,

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

  const recent: StudentAttemptItem[] = recentAttempts.slice(0, 20).map((a) => {
    const pct = percent(a.score, a.total);
    return {
      id: a.id,
      completedAt: a.completedAt!.toISOString(),
      score: a.score,
      total: a.total,
      percent: pct,
      mastered: a.total > 0 && a.score === a.total,
      missedCount: Math.max(0, a.total - a.score),
    };
  });

  const topMissedFacts: MissedFact[] = missedFacts.map((m) => ({
    questionId: m.questionId,
    factorA: m.factorA,
    factorB: m.factorB,
    answer: m.answer,
    incorrectCount: m.incorrectCount,
    totalCount: m.totalCount,
    errorRate: m.totalCount ? Math.round((m.incorrectCount / m.totalCount) * 100) : 0,
  }));

  return {
    classroom: { id: classroom.id, name: classroom.name ?? `Classroom ${classroom.id}` },
    range: {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      days,
    },
    student,
    insights: { topMissedFacts },
    recent: { attempts: recent },
  };
}
