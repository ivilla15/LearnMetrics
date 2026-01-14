// data/assignmentSchedules.repo.ts
import { prisma } from '@/data/prisma';
import type { AssignmentSchedule } from '@prisma/client';

export type CreateScheduleArgs = {
  classroomId: number;
  opensAtLocalTime: string;
  windowMinutes: number;
  isActive?: boolean;
  days: string[];
  numQuestions: number;
};

export type UpdateScheduleArgs = {
  id: number;
  opensAtLocalTime?: string;
  windowMinutes?: number;
  isActive?: boolean;
  days?: string[];
  numQuestions?: number;
};

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

export async function findScheduleById(scheduleId: number): Promise<AssignmentSchedule | null> {
  return prisma.assignmentSchedule.findUnique({
    where: { id: scheduleId },
  });
}

export async function createSchedule(data: CreateScheduleArgs) {
  return prisma.assignmentSchedule.create({ data });
}

export async function updateSchedule({ id, ...data }: UpdateScheduleArgs) {
  return prisma.assignmentSchedule.update({
    where: { id },
    data,
  });
}

export async function findAllActiveSchedules() {
  return prisma.assignmentSchedule.findMany({
    where: { isActive: true },
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
