// utils/students.ts

export type NewStudentName = {
  firstName: string;
  lastName: string;
};

export type NewStudentInput = {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  level: number;
};

// Normalize and generate username from first + last with uniqueness
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
