import { prisma } from '@/data/prisma';
import { NotFoundError } from '@/core/errors';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';
import { DOMAIN_CONFIG } from '@/core/domain';
import { clampInt } from '@/utils/math';

export async function initializeStudentProgressForNewStudent(params: {
  classroomId: number;
  studentId: number;
  startingDomain?: DomainCode;
  startingLevel?: number;
}): Promise<void> {
  const policy = await prisma.classroomProgressionPolicy.findUnique({
    where: { classroomId: params.classroomId },
    select: { enabledDomains: true, maxNumber: true },
  });

  if (!policy) throw new NotFoundError('Progression policy not found');

  const enabledDomains = policy.enabledDomains.filter((d) =>
    (DOMAIN_CODES as readonly string[]).includes(d),
  );

  if (enabledDomains.length === 0) throw new Error('Progression policy has no enabled domains');

  const maxNumber = clampInt(policy.maxNumber ?? 12, 1, 100);

  const primaryDomain = enabledDomains[0]!;
  const startDomain: DomainCode =
    params.startingDomain && enabledDomains.includes(params.startingDomain)
      ? params.startingDomain
      : primaryDomain;

  const startMaxLevel = DOMAIN_CONFIG[startDomain]?.maxLevel ?? maxNumber;
  const startLevelRaw = Number.isFinite(params.startingLevel ?? NaN)
    ? (params.startingLevel as number)
    : 1;
  const startLevel = clampInt(Math.trunc(startLevelRaw), 0, startMaxLevel + 1);

  const startIdx = enabledDomains.indexOf(startDomain);

  const map = new Map<DomainCode, number>();
  for (const d of DOMAIN_CODES as readonly DomainCode[]) {
    map.set(d, 1);
  }

  for (let i = 0; i < startIdx; i++) {
    const d = enabledDomains[i]!;
    const dMax = DOMAIN_CONFIG[d]?.maxLevel ?? maxNumber;
    map.set(d, dMax + 1);
  }
  map.set(startDomain, startLevel);

  await prisma.studentProgress.createMany({
    data: (DOMAIN_CODES as readonly DomainCode[]).map((domain) => ({
      studentId: params.studentId,
      domain,
      level: map.get(domain) ?? 1,
    })),
    skipDuplicates: true,
  });
}
