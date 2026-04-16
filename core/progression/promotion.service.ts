import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import type { DomainCode } from '@/types/domain';
import type { PromotionResultDTO } from '@/types/api/progression';
import { DOMAIN_CONFIG } from '@/core/domain';
import { getProgressionSnapshot } from './policySnapshot.service';
import { ensureStudentProgress } from './studentProgress.service';

export async function promoteStudentAfterMastery(params: {
  studentId: number;
  classroomId: number;
  domain: DomainCode;
  // operation is unused post-migration; accepted for call-site compatibility
  operation?: unknown;
}): Promise<PromotionResultDTO> {
  const { studentId, classroomId, domain } = params;

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, classroomId: true },
  });
  if (!student || student.classroomId !== classroomId) {
    throw new NotFoundError('Student not found in classroom');
  }

  await ensureStudentProgress(studentId);

  const snapshot = await getProgressionSnapshot(classroomId);
  const domainOrder = snapshot.enabledDomains;
  const maxLevel = DOMAIN_CONFIG[domain]?.maxLevel ?? snapshot.maxNumber;
  const sentinel = maxLevel + 1;

  const current = await prisma.studentProgress.findUnique({
    where: { studentId_domain: { studentId, domain } },
    select: { level: true },
  });

  const currentLevel = current?.level ?? 1;

  if (currentLevel < maxLevel) {
    const nextLevel = Math.min(currentLevel + 1, maxLevel);
    await prisma.studentProgress.update({
      where: { studentId_domain: { studentId, domain } },
      data: { level: nextLevel },
    });
    return { promoted: false, domain, level: nextLevel };
  }

  const idx = domainOrder.indexOf(domain);
  const nextDomain = idx >= 0 ? domainOrder[idx + 1] : undefined;

  if (!nextDomain) {
    await prisma.studentProgress.update({
      where: { studentId_domain: { studentId, domain } },
      data: { level: sentinel },
    });
    return { promoted: false, domain, level: sentinel };
  }

  await prisma.$transaction([
    prisma.studentProgress.update({
      where: { studentId_domain: { studentId, domain } },
      data: { level: sentinel },
    }),
    prisma.studentProgress.update({
      where: { studentId_domain: { studentId, domain: nextDomain } },
      data: { level: 1 },
    }),
  ]);

  return { promoted: true, domain: nextDomain, level: 1, movedToDomain: nextDomain };
}
