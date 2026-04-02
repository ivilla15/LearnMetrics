export function percent(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

export function isMastery(score: number, total: number): boolean {
  return total > 0 && score === total;
}

export function median(nums: number[]): number {
  if (!nums.length) return 0;
  const arr = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 === 0 ? Math.round((arr[mid - 1] + arr[mid]) / 2) : arr[mid];
}

export function clampTake(raw: unknown, def = 20, max = 50): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.floor(n), max);
}

export function clampInt(n: number, min: number, max: number): number {
  return Math.min(Math.max(Math.trunc(n), min), max);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function randInt(min: number, max: number, rng: () => number = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function uniq<T>(items: readonly T[]): T[] {
  const out: T[] = [];
  const seen = new Set<T>();
  for (const it of items) {
    if (!seen.has(it)) {
      seen.add(it);
      out.push(it);
    }
  }
  return out;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a === 0 ? 1 : a;
}

export function reduceFraction(
  numerator: number,
  denominator: number,
): { numerator: number; denominator: number } {
  const g = gcd(Math.abs(numerator), Math.abs(denominator));
  return { numerator: numerator / g, denominator: denominator / g };
}

// Converts a mixed number (e.g. 3 1/2) to an improper fraction (7/2)
export function mixedToImproper(
  whole: number,
  numerator: number,
  denominator: number,
): { numerator: number; denominator: number } {
  return reduceFraction(whole * denominator + numerator, denominator);
}
