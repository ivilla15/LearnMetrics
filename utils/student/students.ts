export type NewStudentName = {
  firstName: string;
  lastName: string;
};

export type NewStudentInput = {
  firstName: string;
  lastName: string;
  username: string;
  level: number;
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

    if (!base) {
      base = 'student';
    }

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

// Simple, memorable passwords (word + 2-digit number)
const PASSWORD_WORDS = ['apple', 'tiger', 'sun', 'star', 'book', 'tree', 'cloud', 'rocket'];

export function generatePasswords(count: number): string[] {
  const pwds: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const word = PASSWORD_WORDS[i % PASSWORD_WORDS.length];
    const num = String(10 + ((i * 7) % 90)); // 10–99
    pwds.push(`${word}${num}`);
  }
  return pwds;
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
};

function splitOnceComma(line: string): [string, string | null] {
  const idx = line.indexOf(',');
  if (idx === -1) return [line, null];
  return [line.slice(0, idx), line.slice(idx + 1)];
}

/**
 * Accepts lines like:
 * - "John Ulises"
 * - "John Ulises, 5"
 */
export function parseBulkStudentsText(
  input: string,
  existingUsernames: string[],
): NewStudentInput[] {
  const lines = input
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const drafts: ParsedStudentDraft[] = [];

  for (const line of lines) {
    const [nameRaw, levelRaw] = splitOnceComma(line);
    const namePart = (nameRaw ?? '').trim();

    const nameTokens = namePart.split(/\s+/).filter(Boolean);
    if (nameTokens.length < 2) {
      throw new Error(`Each line must be "First Last" (optionally ", level"): "${line}"`);
    }

    const firstName = nameTokens[0];
    const lastName = nameTokens.slice(1).join(' ');

    let level = 1;
    if (levelRaw && levelRaw.trim().length > 0) {
      const parsed = Number.parseInt(levelRaw.trim(), 10);
      if (Number.isNaN(parsed)) {
        throw new Error(`Invalid level in line: "${line}"`);
      }
      level = clampLevel(parsed);
    }

    drafts.push({ firstName, lastName, level });
  }

  // generate usernames once, using drafts + existingUsernames
  const usernames = generateUsernames(
    drafts.map(({ firstName, lastName }) => ({ firstName, lastName })),
    existingUsernames,
  );

  return drafts.map((d, i) => ({
    firstName: d.firstName,
    lastName: d.lastName,
    username: usernames[i],
    level: d.level,
  }));
}

export type PracticeQuestion = {
  id: number;
  factorA: number;
  factorB: number;
};
