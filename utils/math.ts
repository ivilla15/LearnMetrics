export function percent(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
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
