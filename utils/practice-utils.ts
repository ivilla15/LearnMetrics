import type { PracticeGradeResultDTO, PracticeQuestionDTO } from '@/types';
import type { OperationCode } from '@/types/enums';
import { clampInt, percent } from './math';

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function opSymbol(op: OperationCode): string {
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

export function computeAnswer(op: OperationCode, a: number, b: number): number {
  switch (op) {
    case 'ADD':
      return a + b;
    case 'SUB':
      return a - b;
    case 'MUL':
      return a * b;
    case 'DIV':
      return a === 0 ? 0 : Math.trunc(b / a);
  }
}

export function formatPrompt(op: OperationCode, a: number, b: number): string {
  return `${a} ${opSymbol(op)} ${b}`;
}

function makeOneQuestion(params: { operation: OperationCode; level: number; maxNumber: number }): {
  factorA: number;
  factorB: number;
} {
  const { operation, level, maxNumber } = params;

  const lvl = clampInt(level, 1, maxNumber);
  const max = clampInt(maxNumber, 1, 100);

  const allowZero = Math.random() < 0.08;

  switch (operation) {
    case 'MUL': {
      const a = allowZero ? 0 : randInt(1, max);
      const b = lvl;
      return { factorA: a, factorB: b };
    }

    case 'DIV': {
      const divisor = lvl === 0 ? 1 : lvl;
      const k = allowZero ? 0 : randInt(1, max);
      const dividend = divisor * k;
      return { factorA: divisor, factorB: dividend };
    }

    case 'ADD': {
      const a = allowZero ? 0 : randInt(1, max);
      const b = lvl;
      return { factorA: a, factorB: b };
    }

    case 'SUB': {
      const b = lvl;
      const aMin = b;
      const a = allowZero ? b : randInt(aMin, max);
      return { factorA: a, factorB: b };
    }
  }
}

export function makePracticeQuestions(params: {
  operation: OperationCode;
  level: number;
  count: number;
  maxNumber: number;
}): PracticeQuestionDTO[] {
  const { operation, maxNumber } = params;

  const max = clampInt(maxNumber, 1, 100);
  const lvl = clampInt(params.level, 1, max);
  const c = clampInt(params.count, 6, 40);

  const questions: PracticeQuestionDTO[] = [];
  const used = new Set<string>();

  let id = 1;

  while (questions.length < c) {
    const { factorA, factorB } = makeOneQuestion({ operation, level: lvl, maxNumber: max });

    const key = `${operation}:${factorA}:${factorB}`;
    if (used.has(key)) continue;
    used.add(key);

    questions.push({ id: id++, operation, factorA, factorB });
  }

  return questions;
}

export function gradePractice(
  questions: PracticeQuestionDTO[],
  answers: Record<number, number | ''>,
): PracticeGradeResultDTO {
  const items = questions.map((q) => {
    const correct = computeAnswer(q.operation, q.factorA, q.factorB);

    const givenRaw = answers[q.id];
    const given = givenRaw === '' || givenRaw === undefined ? null : Number(givenRaw);
    const isCorrect = given !== null && Number.isFinite(given) && given === correct;

    return {
      id: q.id,
      prompt: formatPrompt(q.operation, q.factorA, q.factorB),
      studentAnswer: given === null ? -1 : given,
      correctAnswer: correct,
      isCorrect,
    };
  });

  const total = items.length;
  const score = items.filter((i) => i.isCorrect).length;

  return { total, score, percent: percent(score, total), items };
}
