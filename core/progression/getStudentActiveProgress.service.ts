import { prisma } from '@/data/prisma';
import type { OperationCode } from '@/types/enums';
import type { DomainCode } from '@/types/domain';
import type { ProgressionSnapshotDTO, ProgressionModifier } from '@/types/api/progression';
import { domainToOpModifier } from '@/core/domain';
import { computeActiveDomainAndLevel } from './domainProgress.service';

export async function getStudentActiveDomain(params: {
  studentId: number;
  snapshot: ProgressionSnapshotDTO;
}): Promise<{ domain: DomainCode; level: number }> {
  const rows = await prisma.studentProgress.findMany({
    where: { studentId: params.studentId },
    select: { domain: true, level: true },
  });
  return computeActiveDomainAndLevel(rows, params.snapshot.enabledDomains);
}

export async function getStudentActiveProgress(params: {
  studentId: number;
  snapshot: ProgressionSnapshotDTO;
}): Promise<{
  domain: DomainCode;
  level: number;
  operation: OperationCode;
  modifier: ProgressionModifier;
}> {
  const { domain, level } = await getStudentActiveDomain(params);
  const { operation, modifier } = domainToOpModifier(domain);
  return { domain, level, operation, modifier };
}
