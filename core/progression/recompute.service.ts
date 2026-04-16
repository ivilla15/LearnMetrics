import { prisma } from '@/data/prisma';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';
import { DOMAIN_CONFIG } from '@/core/domain';
import { getProgressionSnapshot } from './policySnapshot.service';

/**
 * Recomputes a student's progression from scratch using only non-INVALIDATED
 * completed mastery attempts. Called after a teacher invalidates or un-invalidates
 * an attempt.
 *
 * KEY INVARIANT: Only domains at or after the earliest mastered domain in the
 * policy order are touched. Domains that come before (e.g. ADD_WHOLE when the
 * student was teacher-placed into MUL_WHOLE) are preserved from the current DB.
 */
export async function recomputeStudentProgressionFromValidAttempts(params: {
  studentId: number;
  classroomId: number;
}): Promise<void> {
  const { studentId, classroomId } = params;

  const snapshot = await getProgressionSnapshot(classroomId);
  const domainOrder = snapshot.enabledDomains;

  const currentProgress = await prisma.studentProgress.findMany({
    where: { studentId },
    select: { domain: true, level: true },
  });
  const currentByDomain = new Map(currentProgress.map((r) => [r.domain, r.level]));

  const allValid = await prisma.attempt.findMany({
    where: {
      studentId,
      reviewStatus: { not: 'INVALIDATED' },
      completedAt: { not: null },
    },
    select: {
      score: true,
      total: true,
      domainAtTime: true,
      operationAtTime: true,
      levelAtTime: true,
      completedAt: true,
    },
    orderBy: { completedAt: 'asc' },
  });

  // Derive effective domain for each attempt: domainAtTime preferred, fallback to op_WHOLE.
  type MasteryEntry = { domain: DomainCode; levelAtTime: number | null };
  const allMasteries: MasteryEntry[] = allValid
    .filter((a) => a.total > 0 && a.score === a.total)
    .map((a) => {
      const domain: DomainCode | null =
        a.domainAtTime ?? (a.operationAtTime ? (`${a.operationAtTime}_WHOLE` as DomainCode) : null);
      return domain ? { domain, levelAtTime: a.levelAtTime } : null;
    })
    .filter((a): a is MasteryEntry => a !== null);

  if (allMasteries.length === 0) {
    // Roll back to pre-attempt state.
    const firstAttempt = await prisma.attempt.findFirst({
      where: { studentId, completedAt: { not: null } },
      orderBy: { completedAt: 'asc' },
      select: { domainAtTime: true, operationAtTime: true, levelAtTime: true },
    });
    if (!firstAttempt) return;

    const startDomain: DomainCode | null =
      firstAttempt.domainAtTime ??
      (firstAttempt.operationAtTime
        ? (`${firstAttempt.operationAtTime}_WHOLE` as DomainCode)
        : null);
    if (!startDomain) return;

    const startDomainIdx = domainOrder.indexOf(startDomain);
    const domainsToReset = (DOMAIN_CODES as readonly DomainCode[]).filter((d) => {
      const idx = domainOrder.indexOf(d);
      return idx >= 0 && idx >= Math.max(0, startDomainIdx);
    });

    if (domainsToReset.length > 0) {
      await prisma.$transaction(
        domainsToReset.map((d) =>
          prisma.studentProgress.upsert({
            where: { studentId_domain: { studentId, domain: d } },
            create: {
              studentId,
              domain: d,
              level: d === startDomain ? (firstAttempt.levelAtTime ?? 1) : 1,
            },
            update: { level: d === startDomain ? (firstAttempt.levelAtTime ?? 1) : 1 },
          }),
        ),
      );
    }
    return;
  }

  const domainsWithMasteries = new Set(allMasteries.map((m) => m.domain));
  const firstMasteryIdx = domainOrder.findIndex((d) => domainsWithMasteries.has(d));
  if (firstMasteryIdx === -1) return;

  // Initialize simulation: preserve before replay range, reset from firstMasteryIdx.
  const levels = new Map<string, number>();
  for (const domain of DOMAIN_CODES as readonly DomainCode[]) {
    const idx = domainOrder.indexOf(domain);
    const beforeReplayRange = idx < 0 || idx < firstMasteryIdx;
    levels.set(domain, beforeReplayRange ? (currentByDomain.get(domain) ?? 1) : 1);
  }

  // Replay masteries chronologically.
  for (const { domain } of allMasteries) {
    const maxLevel = DOMAIN_CONFIG[domain]?.maxLevel ?? snapshot.maxNumber;
    const sentinel = maxLevel + 1;
    const currentLevel = levels.get(domain) ?? 1;

    if (currentLevel < maxLevel) {
      levels.set(domain, Math.min(currentLevel + 1, maxLevel));
    } else {
      const idx = domainOrder.indexOf(domain);
      const nextDomain = idx >= 0 ? domainOrder[idx + 1] : undefined;
      levels.set(domain, sentinel);
      if (nextDomain) levels.set(nextDomain, 1);
    }
  }

  const domainsToWrite = (DOMAIN_CODES as readonly DomainCode[]).filter((d) => {
    const idx = domainOrder.indexOf(d);
    return idx >= 0 && idx >= firstMasteryIdx;
  });

  if (domainsToWrite.length > 0) {
    await prisma.$transaction(
      domainsToWrite.map((d) =>
        prisma.studentProgress.upsert({
          where: { studentId_domain: { studentId, domain: d } },
          create: { studentId, domain: d, level: levels.get(d) ?? 1 },
          update: { level: levels.get(d) ?? 1 },
        }),
      ),
    );
  }
}
