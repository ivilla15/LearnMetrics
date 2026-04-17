import { prisma } from '@/data/prisma';
import { clampInt } from '@/utils/math';
import type { ProgressionSnapshotDTO } from '@/types/api/progression';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';

const DEFAULT_DOMAINS: DomainCode[] = ['ADD_WHOLE', 'SUB_WHOLE', 'MUL_WHOLE', 'DIV_WHOLE'];

export async function getProgressionSnapshot(classroomId: number): Promise<ProgressionSnapshotDTO> {
  const policy = await prisma.classroomProgressionPolicy.upsert({
    where: { classroomId },
    create: {
      classroomId,
      enabledDomains: DEFAULT_DOMAINS,
      maxNumber: 12,
    },
    update: {},
    select: { enabledDomains: true, maxNumber: true },
  });

  const maxNumber = clampInt(policy.maxNumber ?? 12, 1, 100);
  const enabledDomains = policy.enabledDomains.filter(
    (d): d is DomainCode => (DOMAIN_CODES as readonly string[]).includes(d),
  );

  return {
    enabledDomains: enabledDomains.length > 0 ? enabledDomains : DEFAULT_DOMAINS,
    maxNumber,
  };
}
