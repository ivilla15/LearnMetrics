// core/classrooms/createTeacherClassroom.ts
import { prisma } from '@/data/prisma';

const TRIAL_DAYS = 30;

export type CreateTeacherClassroomInput = {
  teacherId: number;
  name: string;
  timeZone: string;
};

export async function createTeacherClassroom(input: CreateTeacherClassroomInput) {
  const now = new Date();

  // One transaction so we can't race into creating 2 classrooms on trial
  return prisma.$transaction(async (tx) => {
    // 1) Ensure entitlement exists (auto-create on first use)
    const entitlement = await tx.teacherEntitlement.upsert({
      where: { teacherId: input.teacherId },
      create: {
        teacherId: input.teacherId,
        plan: 'TRIAL',
        status: 'ACTIVE',
        trialEndsAt: new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
      },
      update: {},
      select: {
        plan: true,
        status: true,
        trialEndsAt: true,
      },
    });

    // 2) Compute entitlement state
    const plan = entitlement.plan;
    const status = entitlement.status;

    const trialActive =
      plan === 'TRIAL' &&
      status === 'ACTIVE' &&
      entitlement.trialEndsAt != null &&
      entitlement.trialEndsAt.getTime() > now.getTime();

    const paidActive = (plan === 'PRO' || plan === 'SCHOOL') && status === 'ACTIVE';

    // For now: active trial OR active paid can create, otherwise blocked
    const canCreateAnything = trialActive || paidActive;

    if (!canCreateAnything) {
      throw new Error('Your trial has ended. Upgrade to Pro to create more classrooms.');
    }

    // 3) Enforce classroom limit for TRIAL (1 classroom)
    if (trialActive) {
      const classroomCount = await tx.classroom.count({
        where: { teacherId: input.teacherId },
      });

      if (classroomCount >= 1) {
        throw new Error('Trial includes 1 classroom. Upgrade to Pro to add more.');
      }
    }

    // 4) Create classroom
    const classroom = await tx.classroom.create({
      data: {
        name: input.name,
        teacherId: input.teacherId,
        timeZone: input.timeZone,
      },
      select: { id: true, name: true, timeZone: true },
    });

    return classroom;
  });
}
