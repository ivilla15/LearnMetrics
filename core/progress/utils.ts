export type Trend = 'improving' | 'regressing' | 'flat' | 'need3';

export function trendFromLast3(pcts: number[]): Trend {
  if (pcts.length < 3) return 'need3';
  const [a, b, c] = pcts;
  if (a < b && b < c) return 'improving';
  if (a > b && b > c) return 'regressing';
  return 'flat';
}

/**
 * Bucket a percent into label strings used in charts.
 */
export function bucketScore(p: number): '0-49' | '50-69' | '70-84' | '85-99' | '100' {
  if (p < 50) return '0-49';
  if (p < 70) return '50-69';
  if (p < 85) return '70-84';
  if (p < 100) return '85-99';
  return '100';
}
