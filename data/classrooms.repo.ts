import { prisma } from '@/data/prisma';
import type { AssignmentMode, AssignmentType } from '@/types/enums';

export async function findClassroomById(id: number) {
  return prisma.classroom.findUnique({ where: { id } });
}

export async function getTeacherClassroomsWithCounts(teacherId: number) {
  const rows = await prisma.classroom.findMany({
    where: { teacherId },
    select: {
      id: true,
      name: true,
      _count: {
        select: {
          Student: true,
          Assignment: true,
          AssignmentSchedule: true,
        },
      },
    },
    orderBy: { id: 'asc' },
  });

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    studentCount: c._count.Student,
    scheduleCount: c._count.AssignmentSchedule,
    assignmentCount: c._count.Assignment,
  }));
}

/**
 * Overview stats for /teacher/classrooms/[id]
 * NOTE: This does NOT do ownership checks. Do that in the service.
 * Returns null if classroom doesn't exist.
 */
export async function getTeacherClassroomOverviewStats(classroomId: number) {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, name: true, timeZone: true },
  });

  if (!classroom) return null;

  const [totalStudents, activeStudents, needsSetup, activeSchedules, attemptsLast7Rows] =
    await Promise.all([
      prisma.student.count({ where: { classroomId } }),
      prisma.student.count({ where: { classroomId, mustSetPassword: false } }),
      prisma.student.count({ where: { classroomId, mustSetPassword: true } }),
      prisma.assignmentSchedule.count({ where: { classroomId, isActive: true } }),
      prisma.attempt.findMany({
        where: {
          completedAt: { gte: weekAgo },
          Student: { classroomId },
        },
        select: { score: true, total: true },
      }),
    ]);

  const currentAssignment = await prisma.assignment.findFirst({
    where: {
      classroomId,
      opensAt: { lte: now },
      OR: [{ closesAt: null }, { closesAt: { gte: now } }],
    },
    orderBy: { opensAt: 'asc' },
    select: { id: true, opensAt: true, closesAt: true, mode: true, type: true },
  });

  const nextUpcoming = currentAssignment
    ? null
    : await prisma.assignment.findFirst({
        where: { classroomId, opensAt: { gte: now } },
        orderBy: { opensAt: 'asc' },
        select: { id: true, opensAt: true, closesAt: true, mode: true, type: true },
      });

  const picked = currentAssignment ?? nextUpcoming;

  const attemptsLast7 = attemptsLast7Rows.length;
  const masteryLast7 = attemptsLast7Rows.reduce(
    (acc, a) => acc + (a.total > 0 && a.score === a.total ? 1 : 0),
    0,
  );
  const masteryRateLast7 = attemptsLast7 > 0 ? Math.round((masteryLast7 / attemptsLast7) * 100) : 0;

  return {
    classroom: { id: classroom.id, name: classroom.name, timeZone: classroom.timeZone },

    totalStudents,
    activeStudents,
    needsSetup,

    activeSchedules,

    nextTest: picked
      ? {
          id: picked.id,
          opensAt: picked.opensAt.toISOString(),
          closesAt: picked.closesAt ? picked.closesAt.toISOString() : null,
          mode: picked.mode as AssignmentMode,
          type: picked.type as AssignmentType,
        }
      : null,

    attemptsLast7,
    masteryLast7,
    masteryRateLast7,
  };
}
