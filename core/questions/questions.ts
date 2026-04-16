import type { OperationCode } from '@/types/enums';
import type { DomainCode } from '@/types/domain';
import {
  type GeneratedQuestionDTO,
  type GradeItemDTO,
  type GradeResultDTO,
  type OperandValue,
  type AnswerValue,
  type FractionAnswerMode,
  opSymbol,
  formatOperand,
} from '@/types';
import { mulberry32, seededShuffle } from '@/utils/seeded-shuffle';
import { clampInt, percent, mixedToImproper, reduceFraction, randInt } from '@/utils/math';
import { DOMAIN_CONFIG, domainToOpModifier } from '@/core/domain';

// ─── Answer computation ───────────────────────────────────────────────────────

export function computeAnswer(op: OperationCode, a: OperandValue, b: OperandValue): AnswerValue {
  // Fraction path
  if (a.kind === 'fraction' || b.kind === 'fraction') {
    const toFrac = (v: OperandValue) =>
      v.kind === 'fraction'
        ? { n: v.numerator, d: v.denominator }
        : {
            n: v.kind === 'integer' ? v.value : Math.round(v.value * 100),
            d: v.kind === 'integer' ? 1 : 100,
          };

    const fa = toFrac(a);
    const fb = toFrac(b);

    let n: number;
    let d: number;

    switch (op) {
      case 'ADD':
        n = fa.n * fb.d + fb.n * fa.d;
        d = fa.d * fb.d;
        break;
      case 'SUB':
        n = fa.n * fb.d - fb.n * fa.d;
        d = fa.d * fb.d;
        break;
      case 'MUL':
        n = fa.n * fb.n;
        d = fa.d * fb.d;
        break;
      case 'DIV':
        if (fb.n === 0) return { kind: 'fraction', numerator: 0, denominator: 1 };
        n = fa.n * fb.d;
        d = fa.d * fb.n;
        break;
    }

    const reduced = reduceFraction(n, d);
    return { kind: 'fraction', ...reduced };
  }

  // Decimal / integer path
  const av = a.kind === 'integer' ? a.value : a.value;
  const bv = b.kind === 'integer' ? b.value : b.value;

  let result: number;
  switch (op) {
    case 'ADD':
      result = av + bv;
      break;
    case 'SUB':
      result = av - bv;
      break;
    case 'MUL':
      result = av * bv;
      break;
    case 'DIV':
      result = bv === 0 ? 0 : av / bv;
      break;
  }

  // Round to 4 decimal places to avoid floating point noise
  result = Math.round(result * 10000) / 10000;
  return { kind: 'decimal', value: result };
}

// Keep the old integer version for the assignment route until we migrate it
export function computeAnswerInt(op: OperationCode, a: number, b: number): number {
  switch (op) {
    case 'ADD':
      return a + b;
    case 'SUB':
      return a - b;
    case 'MUL':
      return a * b;
    case 'DIV':
      return b === 0 ? 0 : Math.trunc(a / b);
  }
}

// ─── Operand generation ───────────────────────────────────────────────────────

function fractionPool(): Array<{ numerator: number; denominator: number }> {
  return [
    { numerator: 1, denominator: 2 },

    { numerator: 1, denominator: 3 },
    { numerator: 2, denominator: 3 },

    { numerator: 1, denominator: 4 },
    { numerator: 2, denominator: 4 },
    { numerator: 3, denominator: 4 },

    { numerator: 1, denominator: 5 },
    { numerator: 2, denominator: 5 },
    { numerator: 3, denominator: 5 },
    { numerator: 4, denominator: 5 },

    { numerator: 1, denominator: 6 },
    { numerator: 5, denominator: 6 },

    { numerator: 1, denominator: 8 },
    { numerator: 3, denominator: 8 },
    { numerator: 5, denominator: 8 },
    { numerator: 7, denominator: 8 },

    { numerator: 1, denominator: 10 },
    { numerator: 3, denominator: 10 },
    { numerator: 7, denominator: 10 },
    { numerator: 9, denominator: 10 },
  ];
}


// ─── Difficulty-band ranges for ADD_WHOLE / SUB_WHOLE ────────────────────────
//
// Each level maps to (aMin..aMax) for the first operand and (bMin..bMax) for
// the second.  Level 0 = tiny single-digit; level 12 = five-digit numbers.
// For SUB, bMax is further clamped to ≤ a at generation time (no negatives).

const WHOLE_DIFFICULTY_RANGES: Record<number, { aMin: number; aMax: number; bMin: number; bMax: number }> = {
  0:  { aMin: 1,     aMax: 4,     bMin: 1,    bMax: 4 },
  1:  { aMin: 1,     aMax: 9,     bMin: 1,    bMax: 9 },
  2:  { aMin: 10,    aMax: 30,    bMin: 1,    bMax: 9 },
  3:  { aMin: 10,    aMax: 99,    bMin: 1,    bMax: 19 },
  4:  { aMin: 20,    aMax: 60,    bMin: 10,   bMax: 40 },
  5:  { aMin: 20,    aMax: 99,    bMin: 10,   bMax: 79 },
  6:  { aMin: 100,   aMax: 299,   bMin: 10,   bMax: 99 },
  7:  { aMin: 100,   aMax: 599,   bMin: 50,   bMax: 299 },
  8:  { aMin: 200,   aMax: 999,   bMin: 100,  bMax: 799 },
  9:  { aMin: 1000,  aMax: 2999,  bMin: 100,  bMax: 999 },
  10: { aMin: 1000,  aMax: 5999,  bMin: 500,  bMax: 4999 },
  11: { aMin: 1000,  aMax: 9999,  bMin: 1000, bMax: 8999 },
  12: { aMin: 10000, aMax: 99999, bMin: 1000, bMax: 89999 },
};

// ─── Pool size ────────────────────────────────────────────────────────────────

export function getMaxUniqueQuestionsFor(params: {
  operation: OperationCode;
  level: number;
  maxNumber: number;
  modifier: 'DECIMAL' | 'FRACTION' | null;
}): number {
  const max = clampInt(params.maxNumber, 1, 100);
  const lvl = clampInt(params.level, 1, max);

  if (params.modifier === 'DECIMAL') {
    // RNG-based generator — no fixed pool ceiling; large sentinel so callers don't cap count
    return 200;
  }

  if (params.modifier === 'FRACTION') {
    // RNG-based generator — no fixed pool ceiling; large sentinel so callers don't cap count
    return 200;
  }

  const zeroCount = 1;
  switch (params.operation) {
    case 'MUL':
    case 'ADD':
    case 'DIV':
      return max + zeroCount;
    case 'SUB':
      return Math.max(0, max - lvl + 1) + zeroCount;
  }
}

// ─── Difficulty-band ranges for fraction domains ─────────────────────────────

function maxDenomForFractionLevel(level: number): number {
  if (level <= 2) return 4;
  if (level <= 4) return 5;
  if (level <= 6) return 6;
  if (level <= 8) return 8;
  return 10;
}

function fractionPoolForLevel(level: number): Array<{ numerator: number; denominator: number }> {
  const maxDenom = maxDenomForFractionLevel(level);
  return fractionPool().filter((f) => f.denominator <= maxDenom);
}

/**
 * DIFFICULTY_BAND strategy for fraction domains (ADD/SUB/MUL/DIV _FRACTION).
 *
 * Both operands are proper fractions drawn from a level-appropriate pool.
 * Level controls which denominators are in play — larger denominators appear
 * at higher levels.  For SUB the operands are swapped when needed so the
 * result is always non-negative.  Never fails regardless of count.
 */
function generateDifficultyBandFractionQuestions(params: {
  operation: 'ADD' | 'SUB' | 'MUL' | 'DIV';
  level: number;
  count: number;
  seed: number;
}): GeneratedQuestionDTO[] {
  const { operation, count, seed } = params;
  const pool = fractionPoolForLevel(clampInt(params.level, 0, 12));
  const safePool = pool.length > 0 ? pool : fractionPool(); // guard against empty (shouldn't happen)
  const rng = mulberry32(seed);

  const frac = (f: { numerator: number; denominator: number }): OperandValue => ({
    kind: 'fraction',
    numerator: f.numerator,
    denominator: f.denominator,
  });

  return Array.from({ length: count }, (_, i) => {
    const rawA = safePool[Math.floor(rng() * safePool.length)]!;
    const rawB = safePool[Math.floor(rng() * safePool.length)]!;

    let opA = frac(rawA);
    let opB = frac(rawB);

    // Ensure a >= b as fractions so subtraction result is non-negative.
    if (operation === 'SUB') {
      if (rawA.numerator * rawB.denominator < rawB.numerator * rawA.denominator) {
        opA = frac(rawB);
        opB = frac(rawA);
      }
    }

    return { id: i + 1, operation, operandA: opA, operandB: opB, modifier: 'FRACTION' };
  });
}

// ─── Difficulty-band ranges for decimal domains ───────────────────────────────

type DecimalLevelConfig = {
  precision: number; // decimal places for generated operands
  max: number;       // upper bound for operand magnitudes
  intMax: number;    // upper bound for the integer multiplier in MUL
};

const DECIMAL_LEVEL_CONFIG: Record<number, DecimalLevelConfig> = {
  0:  { precision: 1, max: 2.9,    intMax: 3  },
  1:  { precision: 1, max: 4.9,    intMax: 5  },
  2:  { precision: 1, max: 9.9,    intMax: 9  },
  3:  { precision: 1, max: 19.9,   intMax: 9  },
  4:  { precision: 2, max: 2.99,   intMax: 9  },
  5:  { precision: 2, max: 4.99,   intMax: 9  },
  6:  { precision: 2, max: 9.99,   intMax: 9  },
  7:  { precision: 2, max: 19.99,  intMax: 12 },
  8:  { precision: 2, max: 49.99,  intMax: 12 },
  9:  { precision: 2, max: 99.99,  intMax: 12 },
  10: { precision: 2, max: 199.99, intMax: 25 },
  11: { precision: 2, max: 499.99, intMax: 50 },
  12: { precision: 2, max: 999.99, intMax: 99 },
};

// Divisors whose quotients with typical decimal dividends are always clean.
const CLEAN_DECIMAL_DIVISORS = [2, 4, 5, 10, 20, 25, 50];

/**
 * DIFFICULTY_BAND strategy for decimal domains (ADD/SUB/MUL/DIV _DECIMAL).
 *
 * ADD/SUB: both operands are decimals in the level-appropriate range; SUB
 *   swaps when needed so the result is non-negative.
 * MUL: decimal × integer at levels 0–6; decimal × decimal at levels 7–12.
 * DIV: picks a clean integer divisor, a decimal quotient, then derives
 *   the dividend so the result is always a representable decimal.
 * Never fails regardless of count.
 */
function generateDifficultyBandDecimalQuestions(params: {
  operation: 'ADD' | 'SUB' | 'MUL' | 'DIV';
  level: number;
  count: number;
  seed: number;
}): GeneratedQuestionDTO[] {
  const { operation, count, seed } = params;
  const lvl = clampInt(params.level, 0, 12);
  const cfg = DECIMAL_LEVEL_CONFIG[lvl]!;
  const rng = mulberry32(seed);
  const factor = 10 ** cfg.precision;
  const minVal = 1 / factor; // e.g. 0.1 (precision=1) or 0.01 (precision=2)

  const intOp = (v: number): OperandValue => ({ kind: 'integer', value: v });
  const decOp = (v: number): OperandValue => ({ kind: 'decimal', value: v });

  function randDec(lo: number, hi: number): number {
    if (hi <= lo) return lo;
    const raw = lo + rng() * (hi - lo);
    return Math.round(Math.max(lo, Math.min(hi, raw)) * factor) / factor;
  }

  return Array.from({ length: count }, (_, i) => {
    let opA: OperandValue;
    let opB: OperandValue;

    switch (operation) {
      case 'ADD': {
        opA = decOp(randDec(minVal, cfg.max));
        opB = decOp(randDec(minVal, cfg.max));
        break;
      }
      case 'SUB': {
        const a = randDec(minVal * 2, cfg.max);
        const b = randDec(minVal, a);
        opA = decOp(a);
        opB = decOp(b);
        break;
      }
      case 'MUL': {
        const a = randDec(minVal, cfg.max);
        opA = decOp(a);
        if (lvl < 7) {
          opB = intOp(Math.max(1, Math.ceil(rng() * cfg.intMax)));
        } else {
          // decimal × decimal at higher levels
          const smallMax = Math.min(9.9, cfg.max);
          opB = decOp(randDec(minVal, smallMax));
        }
        break;
      }
      case 'DIV': {
        // Pick a clean divisor, pick a decimal quotient, back-compute the dividend.
        // This guarantees the answer is always a representable decimal.
        const validDivisors = CLEAN_DECIMAL_DIVISORS.filter((d) => d <= cfg.intMax);
        const divisor = (validDivisors.length > 0 ? validDivisors : [2])[
          Math.floor(rng() * (validDivisors.length || 1))
        ]!;
        const quotient = randDec(minVal, cfg.max / divisor);
        const dividend = Math.round(divisor * quotient * factor) / factor;
        opA = decOp(Math.max(minVal, dividend));
        opB = intOp(divisor);
        break;
      }
    }

    return { id: i + 1, operation, operandA: opA, operandB: opB, modifier: 'DECIMAL' };
  });
}

// ─── Domain-based generator strategies ───────────────────────────────────────

/**
 * FACT_FAMILY strategy (MUL_WHOLE, DIV_WHOLE).
 *
 * MUL level k: pool is k×0, k×1, … k×12  (13 questions)
 * DIV level 0: pool is 0÷1, 0÷2, … 0÷12  (avoids ÷0)
 * DIV level k: pool is 0÷k, k÷k, … 144÷k (k*0..12)
 */
function generateFactFamilyQuestions(params: {
  operation: 'MUL' | 'DIV';
  level: number;
  count: number;
  seed: number;
}): GeneratedQuestionDTO[] {
  const { operation, level, count, seed } = params;
  const intOp = (v: number): OperandValue => ({ kind: 'integer', value: v });
  const pool: Array<{ a: number; b: number }> = [];

  if (operation === 'MUL') {
    for (let n = 0; n <= 12; n++) pool.push({ a: level, b: n });
  } else {
    if (level === 0) {
      for (let n = 1; n <= 12; n++) pool.push({ a: 0, b: n }); // 0÷n, never ÷0
    } else {
      for (let n = 0; n <= 12; n++) pool.push({ a: level * n, b: level });
    }
  }

  const shuffled = seededShuffle(pool, seed);
  return Array.from({ length: count }, (_, i) => {
    const item = shuffled[i % shuffled.length]!;
    return { id: i + 1, operation, operandA: intOp(item.a), operandB: intOp(item.b), modifier: null };
  });
}

/**
 * DIFFICULTY_BAND strategy for ADD_WHOLE / SUB_WHOLE.
 *
 * Uses seeded RNG to generate operands in the level-appropriate range.
 * For SUB, bMax is clamped to ≤ a so the result is always non-negative.
 * Never fails — allows repetition by design.
 */
function generateDifficultyBandWholeQuestions(params: {
  operation: 'ADD' | 'SUB';
  level: number;
  count: number;
  seed: number;
}): GeneratedQuestionDTO[] {
  const { operation, count, seed } = params;
  const range = WHOLE_DIFFICULTY_RANGES[clampInt(params.level, 0, 12)]!;
  const rng = mulberry32(seed);
  const intOp = (v: number): OperandValue => ({ kind: 'integer', value: v });

  return Array.from({ length: count }, (_, i) => {
    const a = randInt(range.aMin, range.aMax, rng);
    const b =
      operation === 'SUB'
        ? randInt(range.bMin, Math.min(range.bMax, a), rng)
        : randInt(range.bMin, range.bMax, rng);
    return { id: i + 1, operation, operandA: intOp(a), operandB: intOp(b), modifier: null };
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Primary entry point for question generation.
 *
 * Dispatches by progression style:
 *   FACT_FAMILY  (MUL_WHOLE, DIV_WHOLE)        → fact-table pool, shuffled + tiled
 *   DIFFICULTY_BAND ADD/SUB_WHOLE              → RNG-based difficulty-band, whole numbers
 *   DIFFICULTY_BAND *_FRACTION                 → RNG-based, fraction × fraction pairs
 *   DIFFICULTY_BAND *_DECIMAL                  → RNG-based, decimal operands in level range
 *
 * Always returns exactly `count` questions. Never throws due to small pools.
 */
export function generateQuestions(params: {
  domain: DomainCode;
  level: number;
  count: number;
  seed: number;
}): GeneratedQuestionDTO[] {
  const { domain, level, count, seed } = params;
  const config = DOMAIN_CONFIG[domain];
  const lvl = clampInt(level, 0, config.maxLevel);
  const targetCount = clampInt(count, 1, 200);

  if (config.progressionStyle === 'FACT_FAMILY') {
    const op = domain === 'MUL_WHOLE' ? 'MUL' : 'DIV';
    return generateFactFamilyQuestions({ operation: op, level: lvl, count: targetCount, seed });
  }

  if (domain === 'ADD_WHOLE' || domain === 'SUB_WHOLE') {
    const op = domain === 'ADD_WHOLE' ? 'ADD' : 'SUB';
    return generateDifficultyBandWholeQuestions({ operation: op, level: lvl, count: targetCount, seed });
  }

  // Fraction and decimal domains: proper DIFFICULTY_BAND generators.
  // Level represents difficulty (denominator complexity / decimal magnitude),
  // not a literal operand value.
  const { operation } = domainToOpModifier(domain);
  if (domain.endsWith('_FRACTION')) {
    return generateDifficultyBandFractionQuestions({
      operation: operation as 'ADD' | 'SUB' | 'MUL' | 'DIV',
      level: lvl,
      count: targetCount,
      seed,
    });
  }
  return generateDifficultyBandDecimalQuestions({
    operation: operation as 'ADD' | 'SUB' | 'MUL' | 'DIV',
    level: lvl,
    count: targetCount,
    seed,
  });
}

// ─── Grading ──────────────────────────────────────────────────────────────────

function answersAreEqual(
  correct: AnswerValue,
  given: AnswerValue,
  fractionMode: FractionAnswerMode,
): boolean {
  if (correct.kind === 'decimal' && given.kind === 'decimal') {
    return Math.round(correct.value * 10000) === Math.round(given.value * 10000);
  }

  if (correct.kind === 'fraction' && given.kind === 'fraction') {
    const normCorrect = reduceFraction(correct.numerator, correct.denominator);
    const normGiven = reduceFraction(given.numerator, given.denominator);

    const improperMatch =
      normCorrect.numerator === normGiven.numerator &&
      normCorrect.denominator === normGiven.denominator;

    if (fractionMode === 'improper-only') return improperMatch;

    // Check if given is a mixed number representation
    // e.g. student types whole=3, numerator=1, denominator=2 meaning 3 1/2 = 7/2
    // We encode mixed numbers as numerator > denominator with a whole part
    const wholeGiven = Math.floor(normGiven.numerator / normGiven.denominator);
    const remainderN = normGiven.numerator % normGiven.denominator;
    const mixedAsImproper = mixedToImproper(wholeGiven, remainderN, normGiven.denominator);

    const mixedMatch =
      mixedAsImproper.numerator === normCorrect.numerator &&
      mixedAsImproper.denominator === normCorrect.denominator;

    if (fractionMode === 'mixed-only') return mixedMatch;

    return improperMatch || mixedMatch;
  }

  return false;
}

export function gradeGeneratedQuestions(params: {
  questions: GeneratedQuestionDTO[];
  answersByIndex: Record<number, AnswerValue | null>;
  fractionAnswerMode?: FractionAnswerMode;
}): GradeResultDTO {
  const { questions, answersByIndex } = params;
  const fractionMode = params.fractionAnswerMode ?? 'both';

  let score = 0;

  const items: GradeItemDTO[] = questions.map((q, idx) => {
    const correct = computeAnswer(q.operation, q.operandA, q.operandB);
    const given = answersByIndex[idx] ?? null;

    const isCorrect = given !== null && answersAreEqual(correct, given, fractionMode);

    if (isCorrect) score++;

    return {
      id: q.id,
      prompt: `${formatOperand(q.operandA)} ${opSymbol(q.operation)} ${formatOperand(q.operandB)}`,
      studentAnswer: given,
      correctAnswer: correct,
      isCorrect,
    };
  });

  return {
    total: items.length,
    score,
    percent: percent(score, items.length),
    items,
  };
}
