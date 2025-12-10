import { submitAttempt } from '@/core/attempts/service';
import { submitAttemptSchema } from '@/validation/attempts.schema';
import { jsonResponse, errorResponse } from '@/utils/http';
import { ZodError } from 'zod';
import { requireStudent, AuthError } from '@/core/auth';
import { NotFoundError, ConflictError } from '@/core/errors';

export async function POST(request: Request) {
  try {
    // 0) Auth
    const student = await requireStudent(request);

    // 1) Parse body
    const raw = await request.json();
    const parsed = submitAttemptSchema.parse(raw); // now only assignmentId + answers

    // 2) Combine body + authenticated student
    const input = {
      ...parsed,
      studentId: student.id,
    };

    // 3) Business logic
    const result = await submitAttempt(input);

    // 4) Success
    return jsonResponse(result, 200);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse({ error: 'Invalid request body', issues: err.issues }, 400);
    }
    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
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
