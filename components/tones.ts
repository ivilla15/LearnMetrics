import type { Tone } from '../types/tone';

export function pctTone(p: number | null): Tone {
  if (p === null || !Number.isFinite(p)) return 'muted';
  if (p >= 100) return 'success';
  if (p >= 70) return 'warning';
  return 'danger';
}

export function missedTone(m: number | null): Tone {
  if (m === null || !Number.isFinite(m)) return 'muted';
  if (m === 0) return 'success';
  if (m <= 2) return 'warning';
  return 'danger';
}

export function masteryTone(m: boolean | null): Tone {
  if (m === null) return 'muted';
  return m ? 'success' : 'danger';
}
