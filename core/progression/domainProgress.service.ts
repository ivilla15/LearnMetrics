import { DOMAIN_CONFIG } from '@/core/domain';
import type { DomainCode } from '@/types/domain';

/**
 * Resolves the first active domain (level not yet at its completed sentinel) in
 * domain order. Falls back to the last domain in the order if all are graduated.
 */
export function computeActiveDomainAndLevel(
  rows: ReadonlyArray<{ domain: string; level: number }>,
  domainOrder: DomainCode[],
): { domain: DomainCode; level: number } {
  const byDomain = new Map<string, number>();
  for (const row of rows) {
    byDomain.set(row.domain, row.level);
  }

  for (const domain of domainOrder) {
    const maxLevel = DOMAIN_CONFIG[domain]?.maxLevel ?? 12;
    const level = byDomain.get(domain) ?? 1;
    if (level <= maxLevel) return { domain, level };
  }

  const last = domainOrder[domainOrder.length - 1] ?? ('MUL_WHOLE' as DomainCode);
  return { domain: last, level: byDomain.get(last) ?? 1 };
}
