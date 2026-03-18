import { NextResponse } from 'next/server';

export type ApiErrorShape = { error?: unknown };

export function jsonResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400): NextResponse {
  return jsonResponse({ error: message } as const, status);
}

export function errorResponse(
  message: string | Record<string, unknown>,
  status = 400,
): NextResponse {
  return jsonResponse(
    typeof message === 'string' ? ({ error: message } as const) : message,
    status,
  );
}

export function getApiErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const maybe = (payload as ApiErrorShape).error;
    if (typeof maybe === 'string' && maybe.trim().length > 0) return maybe;
  }
  return fallback;
}
