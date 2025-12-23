import { prisma } from '@/data/prisma';
import type { AssignmentSchedule } from '@prisma/client';

export type CreateScheduleArgs = {
  classroomId: number;
  opensAtLocalTime: string; // "HH:mm"
  windowMinutes: number;
  isActive?: boolean;
  days: string[]; // required at create
};

export type UpdateScheduleArgs = {
  id: number;
  opensAtLocalTime?: string;
  windowMinutes?: number;
  isActive?: boolean;
  days?: string[]; // optional at update
};

export async function findByClassroomId(classroomId: number) {
  return prisma.assignmentSchedule.findFirst({
    where: { classroomId },
    orderBy: { id: 'asc' },
  });
}

export async function findAllByClassroomId(classroomId: number): Promise<AssignmentSchedule[]> {
  return prisma.assignmentSchedule.findMany({
    where: { classroomId },
    orderBy: { id: 'asc' },
  });
}

export async function createSchedule(data: CreateScheduleArgs) {
  return prisma.assignmentSchedule.create({
    data,
  });
}

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

export async function findById(id: number): Promise<AssignmentSchedule | null> {
  return prisma.assignmentSchedule.findUnique({
    where: { id },
  });
}

export async function deleteSchedule(id: number): Promise<void> {
  await prisma.assignmentSchedule.delete({
    where: { id },
  });
}
