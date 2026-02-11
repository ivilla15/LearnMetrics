import { clamp } from './math';

export function getNumberParam(
  params: URLSearchParams,
  key: string,
  fallback: number,
  min: number,
  max: number,
) {
  const raw = params.get(key);
  const num = raw === null ? fallback : Number(raw);
  return clamp(Number.isFinite(num) ? num : fallback, min, max);
}
