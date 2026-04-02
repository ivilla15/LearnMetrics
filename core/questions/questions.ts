import type { OperationCode } from '@/types/enums';
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
import { mulberry32 } from '@/utils/seeded-shuffle';
import { clampInt, randInt, percent, mixedToImproper, reduceFraction } from '@/utils/math';

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

function decimalPool(max: number): number[] {
  const pool: number[] = [];

  for (let i = 1; i < max; i++) {
    pool.push(i + 0.1);
    pool.push(i + 0.5);
    pool.push(i + 0.9);
  }

  return pool;
}

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

function generateOneOperands(params: {
  operation: OperationCode;
  level: number;
  maxNumber: number;
  modifier: 'DECIMAL' | 'FRACTION' | null;
  rng: () => number;
}): { operandA: OperandValue; operandB: OperandValue } {
  const { operation, modifier, rng } = params;

  const max = clampInt(params.maxNumber, 1, 100);
  const lvl = clampInt(params.level, 1, max);
  const allowZero = modifier == null && rng() < 0.08;

  // Modifier operand: the "a" side gets the decimal or fraction value
  // The "b" side stays as the level integer (same as current behavior)
  if (modifier === 'DECIMAL') {
    const pool = decimalPool(max);
    const picked = pool[Math.floor(rng() * pool.length)] ?? 1.5;
    const decOp: OperandValue = { kind: 'decimal', value: picked };
    const intOp: OperandValue = { kind: 'integer', value: lvl };

    switch (operation) {
      case 'MUL':
        return { operandA: decOp, operandB: intOp };
      case 'DIV':
        return { operandA: { kind: 'decimal', value: picked * lvl }, operandB: intOp };
      case 'ADD':
        return { operandA: decOp, operandB: intOp };
      case 'SUB':
        return { operandA: { kind: 'decimal', value: picked + lvl }, operandB: intOp };
    }
  }

  if (modifier === 'FRACTION') {
    const pool = fractionPool();
    const picked = pool[Math.floor(rng() * pool.length)] ?? { numerator: 1, denominator: 2 };
    const fracOp: OperandValue = { kind: 'fraction', ...picked };
    const intOp: OperandValue = { kind: 'integer', value: lvl };

    switch (operation) {
      case 'MUL':
        return { operandA: fracOp, operandB: intOp };
      case 'DIV':
        return { operandA: fracOp, operandB: intOp };
      case 'ADD':
        return { operandA: fracOp, operandB: intOp };
      case 'SUB':
        return { operandA: intOp, operandB: fracOp };
    }
  }

  // Integer path (existing behavior, wrapped in OperandValue)
  switch (operation) {
    case 'MUL': {
      const a = allowZero ? 0 : randInt(1, max, rng);
      return {
        operandA: { kind: 'integer', value: a },
        operandB: { kind: 'integer', value: lvl },
      };
    }
    case 'DIV': {
      const q = allowZero ? 0 : randInt(1, max, rng);
      return {
        operandA: { kind: 'integer', value: lvl * q },
        operandB: { kind: 'integer', value: lvl },
      };
    }
    case 'ADD': {
      const a = allowZero ? 0 : randInt(1, max, rng);
      return {
        operandA: { kind: 'integer', value: a },
        operandB: { kind: 'integer', value: lvl },
      };
    }
    case 'SUB': {
      const a = allowZero ? lvl : randInt(lvl, max, rng);
      return {
        operandA: { kind: 'integer', value: a },
        operandB: { kind: 'integer', value: lvl },
      };
    }
  }
}

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
    return decimalPool(max).length;
  }

  if (params.modifier === 'FRACTION') {
    return fractionPool().length;
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
// ─── Public API ───────────────────────────────────────────────────────────────

export function generateQuestions(params: {
  seed: number;
  operation: OperationCode;
  level: number;
  maxNumber: number;
  count: number;
  modifier?: 'DECIMAL' | 'FRACTION' | null;
}): GeneratedQuestionDTO[] {
  const modifier = params.modifier ?? null;
  const rng = mulberry32(params.seed);

  const max = clampInt(params.maxNumber, 1, 100);
  const lvl = clampInt(params.level, 1, max);
  const targetCount = clampInt(params.count, 1, 200);

  const available = getMaxUniqueQuestionsFor({
    operation: params.operation,
    level: lvl,
    maxNumber: max,
    modifier,
  });

  if (targetCount > available) {
    throw new Error(
      `Requested ${targetCount} unique questions but only ${available} are available for ` +
        `${params.operation} at level ${lvl} with maxNumber ${max} and modifier ${modifier ?? 'none'}. ` +
        `Reduce the question count or change level.`,
    );
  }

  const out: GeneratedQuestionDTO[] = [];
  const used = new Set<string>();

  let id = 1;
  const maxAttempts = targetCount * 80;
  let attempts = 0;

  while (out.length < targetCount) {
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('Unable to generate enough unique questions.');
    }

    const { operandA, operandB } = generateOneOperands({
      operation: params.operation,
      level: lvl,
      maxNumber: max,
      modifier,
      rng,
    });

    const key = `${params.operation}:${formatOperand(operandA)}:${formatOperand(operandB)}`;
    if (used.has(key)) continue;
    used.add(key);

    out.push({ id: id++, operation: params.operation, operandA, operandB, modifier });
  }

  return out;
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
