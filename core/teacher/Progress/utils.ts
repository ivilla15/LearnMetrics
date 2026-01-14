export type Trend = 'improving' | 'regressing' | 'flat' | 'insufficient';

export function trendFromLast3(pcts: number[]): Trend {
  if (pcts.length < 3) return 'insufficient';
  const [a, b, c] = pcts;
  if (a < b && b < c) return 'improving';
  if (a > b && b > c) return 'regressing';
  return 'flat';
}
