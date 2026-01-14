// app/api/_shared/handle-error.ts
import { ZodError } from 'zod';
import { errorResponse } from '@/utils/http';
import { NotFoundError, ConflictError } from '@/core/errors';

type Options = {
  defaultMessage?: string;
  defaultStatus?: number;
};

export function handleApiError(err: unknown, opts: Options = {}): Response {
  const defaultMessage = opts.defaultMessage ?? 'Internal server error';
  const defaultStatus = opts.defaultStatus ?? 500;

  if (err instanceof ZodError) return errorResponse('Invalid request body', 400);
  if (err instanceof NotFoundError) return errorResponse(err.message, 404);
  if (err instanceof ConflictError) return errorResponse(err.message, 409);

  // Optional: common ownership/auth message you already use
  if (err instanceof Error && err.message === 'Not allowed') {
    return errorResponse('Not allowed', 403);
  }

  // Optional: surface real error message in dev only
  if (process.env.NODE_ENV === 'development' && err instanceof Error) {
    return errorResponse(err.message, defaultStatus);
  }

  return errorResponse(defaultMessage, defaultStatus);
}
