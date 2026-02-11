import { PracticeQuestion } from './student';

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function makePracticeQuestions(level: number, count: number): PracticeQuestion[] {
  const lvl = clamp(level, 1, 12);
  const c = clamp(count, 6, 40);

  const questions: PracticeQuestion[] = [];
  const used = new Set<string>();

  let id = 1;

  while (questions.length < c) {
    const includeZero = Math.random() < 0.08;
    const factorA = includeZero ? 0 : randInt(1, 12);
    const factorB = lvl;

    const key = `${factorA}x${factorB}`;
    if (used.has(key)) continue;
    used.add(key);

    questions.push({ id: id++, factorA, factorB });
  }

  return questions;
}

export function gradePractice(questions: PracticeQuestion[], answers: Record<number, number | ''>) {
  const items = questions.map((q) => {
    const correct = q.factorA * q.factorB;
    const givenRaw = answers[q.id];
    const given = givenRaw === '' || givenRaw === undefined ? null : Number(givenRaw);
    const isCorrect = given !== null && Number.isFinite(given) && given === correct;

    return {
      id: q.id,
      prompt: `${q.factorA} × ${q.factorB}`,
      studentAnswer: given === null ? -1 : given,
      correctAnswer: correct,
      isCorrect,
    };
  });

  const total = items.length;
  const score = items.filter((i) => i.isCorrect).length;
  const percent = total > 0 ? Math.round((score / total) * 100) : 0;

  return { total, score, percent, items };
}
