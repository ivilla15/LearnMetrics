import { getRosterWithLastAttempt } from '@/core/classrooms/service';
import { jsonResponse } from '@/utils/http';
import { classroomIdParamSchema } from '@/validation/classrooms.schema';
import { ZodError } from 'zod';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  // 1. Validate params.id with classroomIdParamSchema.
  // 2. Call getRosterWithLastAttempt(id).
  // 3. Return jsonResponse(result).
  // 4. Handle errors.
  try {
    const { id } = params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });
    const roster = await getRosterWithLastAttempt(classroomId);
    return jsonResponse(roster, 200);
  } catch (err) {
    if (err instanceof ZodError) {
      return jsonResponse('Invalid classroom id', 400);
    }
    return jsonResponse('Internal server error', 500);
  }
}
