import { NextResponse } from 'next/server';

export function jsonResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(data, { status });
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
