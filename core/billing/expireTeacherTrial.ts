import { prisma } from '@/data/prisma';

export async function expireTeacherTrial(teacherId: number) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.teacherEntitlement.findUnique({ where: { teacherId } });
    if (existing) {
      await tx.teacherEntitlement.update({
        where: { teacherId },
        data: { status: 'EXPIRED', trialEndsAt: new Date() },
      });
    } else {
      await tx.teacherEntitlement.create({
        data: {
          teacherId,
          plan: 'TRIAL',
          status: 'EXPIRED',
          trialEndsAt: new Date(),
        },
      });
    }

    const classroomIds = (
      await tx.classroom.findMany({
        where: { teacherId },
        select: { id: true },
      })
    ).map((c) => c.id);

    if (classroomIds.length) {
      await tx.assignmentSchedule.updateMany({
        where: { classroomId: { in: classroomIds } },
        data: { isActive: false },
      });
    }
  });
}
