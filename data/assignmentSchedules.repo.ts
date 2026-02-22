import { prisma } from '@/data/prisma';
import type { Prisma, AssignmentSchedule } from '@prisma/client';

export async function findPrimaryScheduleByClassroomId(classroomId: number) {
  return prisma.assignmentSchedule.findFirst({
    where: { classroomId },
    orderBy: { id: 'asc' },
  });
}

export async function findAllSchedulesByClassroomId(
  classroomId: number,
): Promise<AssignmentSchedule[]> {
  return prisma.assignmentSchedule.findMany({
    where: { classroomId },
    orderBy: { id: 'asc' },
  });
}

export async function findAllActiveSchedulesWithTimezone() {
  return prisma.assignmentSchedule.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      classroomId: true,
      isActive: true,
      days: true,
      opensAtLocalTime: true,
      windowMinutes: true,

      targetKind: true,

      type: true,
      numQuestions: true,
      operation: true,

      durationMinutes: true,

      dependsOnScheduleId: true,
      offsetMinutes: true,
      recipientRule: true,

      Classroom: { select: { id: true, teacherId: true, timeZone: true } },
    },
  });
}

export async function findScheduleById(scheduleId: number): Promise<AssignmentSchedule | null> {
  return prisma.assignmentSchedule.findUnique({
    where: { id: scheduleId },
  });
}

export async function createSchedule(data: Prisma.AssignmentScheduleUncheckedCreateInput) {
  return prisma.assignmentSchedule.create({ data });
}

export async function updateSchedule(params: {
  id: number;
  data: Prisma.AssignmentScheduleUncheckedUpdateInput;
}) {
  return prisma.assignmentSchedule.update({
    where: { id: params.id },
    data: params.data,
  });
}

export async function findAllActiveSchedules() {
  return prisma.assignmentSchedule.findMany({
    where: { isActive: true },
    orderBy: { id: 'asc' },
  });
}

export async function deleteScheduleById(scheduleId: number): Promise<void> {
  await prisma.assignmentSchedule.delete({
    where: { id: scheduleId },
  });
}

export async function deleteSchedulesByClassroomId(classroomId: number): Promise<void> {
  await prisma.assignmentSchedule.deleteMany({
    where: { classroomId },
  });
}
