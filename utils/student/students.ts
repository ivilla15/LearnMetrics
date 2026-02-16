import { ALL_OPS, BulkStudentInput, type OperationCode } from '@/types';

export type NewStudentName = {
  firstName: string;
  lastName: string;
};

const LEVEL_MIN = 1;
const LEVEL_MAX = 12;

export function generateUsernames(names: NewStudentName[], existingUsernames: string[]): string[] {
  const taken = new Set(existingUsernames.map((u) => u.toLowerCase()));
  const results: string[] = [];

  for (const { firstName, lastName } of names) {
    const firstInitial = firstName.trim().charAt(0) || 's';
    const normalizedLast = lastName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    let base = `${firstInitial}${normalizedLast}`.toLowerCase();

    if (!base) base = 'student';

    let candidate = base;
    let counter = 2;
    while (taken.has(candidate)) {
      candidate = `${base}${counter}`;
      counter += 1;
    }

    taken.add(candidate);
    results.push(candidate);
  }

  return results;
}

export function parsePositiveInt(raw: string | undefined | null) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function clampLevel(n: number) {
  return Math.max(LEVEL_MIN, Math.min(LEVEL_MAX, n));
}

type ParsedStudentDraft = {
  firstName: string;
  lastName: string;
  level: number;
  startingOperation?: OperationCode;
  startingLevel?: number;
};

export function parseBulkStudentsText(
  input: string,
  existingUsernames: string[],
): BulkStudentInput[] {
  const lines = input
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const drafts: ParsedStudentDraft[] = [];

  for (const line of lines) {
    const parts = line
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    const namePart = parts[0] ?? '';
    const nameTokens = namePart.split(/\s+/).filter(Boolean);

    if (nameTokens.length < 2) {
      throw new Error(`Each line must be "First Last" (optional ", level, OP"): "${line}"`);
    }

    const firstName = nameTokens[0];
    const lastName = nameTokens.slice(1).join(' ');

    let level = 1;
    let startingOperation: OperationCode | undefined;

    if (parts.length >= 2) {
      const maybeLevel = Number.parseInt(parts[1], 10);
      if (!Number.isNaN(maybeLevel)) level = clampLevel(maybeLevel);
    }

    if (parts.length >= 3) {
      const op = parts[2].toUpperCase() as OperationCode;
      if (ALL_OPS.includes(op)) startingOperation = op;
    }

    const startingLevel = startingOperation ? level : undefined;

    drafts.push({ firstName, lastName, level, startingOperation, startingLevel });
  }

  const usernames = generateUsernames(
    drafts.map(({ firstName, lastName }) => ({ firstName, lastName })),
    existingUsernames,
  );

  return drafts.map((d, i) => ({
    firstName: d.firstName,
    lastName: d.lastName,
    username: usernames[i],
    level: d.level,
    startingOperation: d.startingOperation,
    startingLevel: d.startingLevel,
  }));
}

export type PracticeQuestion = {
  id: number;
  factorA: number;
  factorB: number;
};
