/**
 * Centralized domain/progression configuration.
 *
 * Single source of truth for progression metadata per domain.
 * All helper functions here are pure — no DB access, no side effects.
 *
 * Phase 1 role:
 *   - Defines the canonical DomainCode set and per-domain metadata.
 *   - Provides helpers used by future progression and UI layers.
 *   - Provides the operation+modifier ↔ domain adapter (bridge to legacy DB model).
 *
 * Phase 2 will migrate StudentProgress to store DomainCode directly, at which
 * point the adapter helpers below become the migration shim and can be removed.
 */

import { DOMAIN_CODES, type DomainCode, type DomainMeta, type ProgressionStyle } from '@/types/domain';
import type { ModifierCode, OperationCode } from '@/types/enums';

// ---------------------------------------------------------------------------
// Per-domain metadata table
// ---------------------------------------------------------------------------

const DEFAULT_MAX_LEVEL = 12;

export const DOMAIN_CONFIG: Record<DomainCode, DomainMeta> = {
  // Whole number — fact-family style for MUL/DIV, difficulty-band for ADD/SUB
  ADD_WHOLE:    { label: 'Addition',               progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 0  },
  SUB_WHOLE:    { label: 'Subtraction',            progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 1  },
  MUL_WHOLE:    { label: 'Multiplication',         progressionStyle: 'FACT_FAMILY',     maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 2  },
  DIV_WHOLE:    { label: 'Division',               progressionStyle: 'FACT_FAMILY',     maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 3  },
  // Fractions
  ADD_FRACTION: { label: 'Adding Fractions',       progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 4  },
  SUB_FRACTION: { label: 'Subtracting Fractions',  progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 5  },
  MUL_FRACTION: { label: 'Multiplying Fractions',  progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 6  },
  DIV_FRACTION: { label: 'Dividing Fractions',     progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 7  },
  // Decimals
  ADD_DECIMAL:  { label: 'Adding Decimals',        progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 8  },
  SUB_DECIMAL:  { label: 'Subtracting Decimals',   progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 9  },
  MUL_DECIMAL:  { label: 'Multiplying Decimals',   progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 10 },
  DIV_DECIMAL:  { label: 'Dividing Decimals',      progressionStyle: 'DIFFICULTY_BAND', maxLevel: DEFAULT_MAX_LEVEL, displayOrder: 11 },
};

// ---------------------------------------------------------------------------
// Domain query helpers
// ---------------------------------------------------------------------------

/** Returns the display label for a domain. */
export function getDomainLabel(domain: DomainCode): string {
  return DOMAIN_CONFIG[domain].label;
}

/** Returns the progression style for a domain. */
export function getProgressionStyle(domain: DomainCode): ProgressionStyle {
  return DOMAIN_CONFIG[domain].progressionStyle;
}

/** Returns the maximum active level for a domain (default 12). */
export function getMaxLevel(domain: DomainCode): number {
  return DOMAIN_CONFIG[domain].maxLevel;
}

/**
 * Returns the graduated-sentinel value for a domain (maxLevel + 1).
 *
 * A StudentProgress row with `level === getCompletedSentinel(domain)` means the
 * student has mastered all levels in that domain.  This matches the existing
 * convention of `maxNumber + 1` used throughout the progression engine.
 */
export function getCompletedSentinel(domain: DomainCode): number {
  return DOMAIN_CONFIG[domain].maxLevel + 1;
}

/**
 * Returns true when a stored level value represents a graduated (completed) domain.
 * A domain is graduated when its stored level exceeds maxLevel.
 */
export function isDomainCompleted(domain: DomainCode, storedLevel: number): boolean {
  return storedLevel > DOMAIN_CONFIG[domain].maxLevel;
}

/**
 * Returns true when a stored level value represents an active (not yet graduated) domain.
 * Levels 0..maxLevel are all active; 0 means "not yet started / diagnostic baseline".
 */
export function isDomainActive(domain: DomainCode, storedLevel: number): boolean {
  return storedLevel >= 0 && storedLevel <= DOMAIN_CONFIG[domain].maxLevel;
}

/**
 * Caps a stored level for display purposes.
 * Graduated sentinels (storedLevel > maxLevel) are shown as maxLevel.
 * Level 0 is valid and displayed as-is.
 */
export function capLevelForDisplay(domain: DomainCode, storedLevel: number): number {
  return Math.min(storedLevel, DOMAIN_CONFIG[domain].maxLevel);
}

/**
 * Returns all DomainCodes sorted by their canonical displayOrder (ascending).
 * Use this when rendering domain lists or tables to guarantee consistent ordering.
 */
export function getDomainsInOrder(): DomainCode[] {
  return (DOMAIN_CODES as readonly DomainCode[]).slice().sort(
    (a, b) => DOMAIN_CONFIG[a].displayOrder - DOMAIN_CONFIG[b].displayOrder,
  );
}

// ---------------------------------------------------------------------------
// Operation + Modifier ↔ DomainCode adapter (Phase 1 compatibility bridge)
// ---------------------------------------------------------------------------

/**
 * Maps the legacy (OperationCode, ModifierCode | null) pair to a canonical DomainCode.
 *
 * This is the bridge between the live DB model and the new explicit domain model.
 * Use this at service boundaries where you need to translate stored
 * (operation, modifier) into the new domain vocabulary.
 *
 * @example
 * opModifierToDomain('ADD', null)        // 'ADD_WHOLE'
 * opModifierToDomain('ADD', 'FRACTION')  // 'ADD_FRACTION'
 * opModifierToDomain('MUL', 'DECIMAL')   // 'MUL_DECIMAL'
 * opModifierToDomain('DIV', undefined)   // 'DIV_WHOLE'
 */
export function opModifierToDomain(
  operation: OperationCode,
  modifier: ModifierCode | null | undefined,
): DomainCode {
  const suffix =
    modifier === 'DECIMAL'
      ? '_DECIMAL'
      : modifier === 'FRACTION'
        ? '_FRACTION'
        : '_WHOLE';
  return `${operation}${suffix}` as DomainCode;
}

/**
 * Reverse adapter: DomainCode → (OperationCode, ModifierCode | null).
 *
 * Use this when the new domain model needs to call legacy question-generation
 * or progression code that still operates on (operation, modifier).
 *
 * @example
 * domainToOpModifier('ADD_WHOLE')    // { operation: 'ADD', modifier: null }
 * domainToOpModifier('MUL_FRACTION') // { operation: 'MUL', modifier: 'FRACTION' }
 */
export function domainToOpModifier(domain: DomainCode): {
  operation: OperationCode;
  modifier: ModifierCode | null;
} {
  if (domain.endsWith('_DECIMAL')) {
    return { operation: domain.slice(0, -'_DECIMAL'.length) as OperationCode, modifier: 'DECIMAL' };
  }
  if (domain.endsWith('_FRACTION')) {
    return { operation: domain.slice(0, -'_FRACTION'.length) as OperationCode, modifier: 'FRACTION' };
  }
  // _WHOLE
  return { operation: domain.slice(0, -'_WHOLE'.length) as OperationCode, modifier: null };
}
