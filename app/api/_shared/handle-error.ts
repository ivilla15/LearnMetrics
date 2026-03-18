import { ZodError } from 'zod';
import type { NextResponse } from 'next/server';
import { NotFoundError, ConflictError } from '@/core/errors';
import { jsonError } from '@/utils/http';

type Options = {
  defaultMessage?: string;
  defaultStatus?: number;
};

export function handleApiError(err: unknown, opts: Options = {}): NextResponse {
  const defaultMessage = opts.defaultMessage ?? 'Internal server error';
  const defaultStatus = opts.defaultStatus ?? 500;

  if (err instanceof ZodError) return jsonError('Invalid request body', 400);
  if (err instanceof NotFoundError) return jsonError(err.message, 404);
  if (err instanceof ConflictError) return jsonError(err.message, 409);

  if (err instanceof Error && err.message === 'Not allowed') {
    return jsonError('Not allowed', 403);
  }

  if (process.env.NODE_ENV === 'development' && err instanceof Error) {
    return jsonError(err.message, defaultStatus);
  }

  return jsonError(defaultMessage, defaultStatus);
}
