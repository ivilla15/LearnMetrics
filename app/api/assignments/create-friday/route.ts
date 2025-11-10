import { createFridayAssignment } from '@/core/assignments/service';
import { errorResponse, jsonResponse } from '@/utils/http';
import { createFridayRequestSchema } from '@/validation/assignments.schema';
import { ZodError } from 'zod';

export async function POST(request: Request) {
  try {
    // 1) Parse request body
    const raw = await request.json();

    // 2) Validate input shape
    const input = createFridayRequestSchema.parse(raw);

    // 3) Business logic
    const result = await createFridayAssignment(input);

    // 4) Success response
    return jsonResponse(result, 200);
  } catch (err) {
    // 5) Error mapping
    if (err instanceof ZodError) {
      return errorResponse('Invalid request body', 400);
    }

    // fallback (remove label syntax)
    return errorResponse('Internal server error', 500);
  }
}
