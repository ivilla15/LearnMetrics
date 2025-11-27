import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { getRosterWithLastAttempt } from '@/core/classrooms/service';
import { jsonResponse, errorResponse } from '@/utils/http';
import { ZodError } from 'zod';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // 1) Unwrap the params Promise (Next 15 requirement)
    const { id } = await params;

    // 2) Validate + coerce id ("1" -> 1)
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    // 3) Call the service
    const roster = await getRosterWithLastAttempt(classroomId);

    // 4) Return success
    return jsonResponse(roster, 200);
  } catch (err) {
    if (err instanceof ZodError) {
      return errorResponse('Invalid classroom id', 400);
    }

    return errorResponse('Internal server error', 500);
  }
}
