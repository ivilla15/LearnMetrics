import { submitAttempt } from '@/core/attempts/service';
import { submitAttemptSchema } from '@/validation/attempts.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { ZodError } from 'zod';
import { NotFoundError, ConflictError } from '@/core/errors';

export async function POST(request: Request) {
  try {
    // Parse incoming JSON
    const raw = await request.json();

    // Validate & coerce with Zod
    const input = submitAttemptSchema.parse(raw);

    // Run business logic
    const result = await submitAttempt(input);

    // Return success
    return jsonResponse(result, 200);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse({ error: 'Invalid request body', issues: err.issues }, 400);
    }

    if (err instanceof NotFoundError) {
      return errorResponse(err.message, 404);
    }

    if (err instanceof ConflictError) {
      return errorResponse(err.message, 409);
    }

    return errorResponse('Internal server error', 500);
  }
}
