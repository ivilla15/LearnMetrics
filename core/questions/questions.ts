import type { OperationCode } from '@/types/enums';
import type { GeneratedQuestionDTO, GradeItemDTO, GradeResultDTO } from '@/types';
import { mulberry32 } from '@/utils/seeded-shuffle';
import { clampInt, randInt, percent } from '@/utils/math';

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

export function opSymbol(op: OperationCode): string {
  switch (op) {
    case 'ADD':
      return '+';
    case 'SUB':
      return '−';
    case 'MUL':
      return '×';
    case 'DIV':
      return '÷';
  }
}

function generateOneOperands(params: {
  operation: OperationCode;
  level: number;
  maxNumber: number;
  rng: () => number;
}): { operandA: number; operandB: number } {
  const { operation, rng } = params;

  const max = clampInt(params.maxNumber, 1, 100);
  const lvl = clampInt(params.level, 1, max);

  const allowZero = rng() < 0.08;

  switch (operation) {
    case 'MUL': {
      const a = allowZero ? 0 : randInt(1, max, rng);
      const b = lvl;
      return { operandA: a, operandB: b };
    }

    case 'DIV': {
      const divisor = lvl;
      const q = allowZero ? 0 : randInt(1, max, rng);
      const dividend = divisor * q;
      return { operandA: dividend, operandB: divisor };
    }

    case 'ADD': {
      const a = allowZero ? 0 : randInt(1, max, rng);
      const b = lvl;
      return { operandA: a, operandB: b };
    }

    case 'SUB': {
      const b = lvl;
      const a = allowZero ? b : randInt(b, max, rng);
      return { operandA: a, operandB: b };
    }
  }
}

export function generateQuestions(params: {
  seed: number;
  operation: OperationCode;
  level: number;
  maxNumber: number;
  count: number;
}): GeneratedQuestionDTO[] {
  const rng = mulberry32(params.seed);

  const max = clampInt(params.maxNumber, 1, 100);
  const lvl = clampInt(params.level, 1, max);
  const targetCount = clampInt(params.count, 1, 200);

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
      rng,
    });

    const key = `${params.operation}:${operandA}:${operandB}`;
    if (used.has(key)) continue;
    used.add(key);

    out.push({
      id: id++,
      operation: params.operation,
      operandA,
      operandB,
    });
  }

  return out;
}

export function gradeGeneratedQuestions(params: {
  questions: GeneratedQuestionDTO[];
  answersByIndex: Record<number, number | ''>;
}): GradeResultDTO {
  const { questions, answersByIndex } = params;

  let score = 0;

  const items: GradeItemDTO[] = questions.map((q, idx) => {
    const correct = computeAnswerInt(q.operation, q.operandA, q.operandB);

    const raw = answersByIndex[idx];
    const given = raw === '' || raw === undefined || raw === null ? null : Number(raw);

    const isCorrect = given !== null && Number.isFinite(given) && given === correct;

    if (isCorrect) score++;

    return {
      id: q.id,
      prompt: `${q.operandA} ${opSymbol(q.operation)} ${q.operandB}`,
      studentAnswer: given === null ? -1 : given,
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
