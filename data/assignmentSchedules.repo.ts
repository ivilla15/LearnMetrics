// src/data/assignmentSchedules.repo.ts
import { prisma } from '@/data/prisma';

export type CreateScheduleArgs = {
  classroomId: number;
  questionSetId: number;
  opensAtLocalTime: string; // "HH:mm"
  windowMinutes: number;
  isActive?: boolean;
};

export type UpdateScheduleArgs = {
  id: number;
  questionSetId?: number;
  opensAtLocalTime?: string;
  windowMinutes?: number;
  isActive?: boolean;
};

// Get the (first) schedule for a classroom, if any.
// For now we assume at most 1 active schedule per classroom (enforced in service logic later).
export async function findByClassroomId(classroomId: number) {
  return prisma.assignmentSchedule.findFirst({
    where: { classroomId },
    orderBy: { id: 'asc' },
  });
}

// Create a new schedule row
export async function createSchedule(data: CreateScheduleArgs) {
  return prisma.assignmentSchedule.create({
    data,
  });
}

// Update an existing schedule by id
export async function updateSchedule({ id, ...data }: UpdateScheduleArgs) {
  return prisma.assignmentSchedule.update({
    where: { id },
    data,
  });
}

export async function findAllActive() {
  return prisma.assignmentSchedule.findMany({
    where: { isActive: true },
  });
}
