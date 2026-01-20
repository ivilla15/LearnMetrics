import { NextResponse } from 'next/server';

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function parseId(raw: string) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function parseCursor(raw: string | null) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}
