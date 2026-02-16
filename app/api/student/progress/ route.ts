import { requireStudent, getStudentProgressRows } from '@/core';
import { jsonResponse, errorResponse } from '@/utils';
import { handleApiError } from '@/app';

export async function GET() {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const progress = await getStudentProgressRows(auth.student.id);

    return jsonResponse(
      {
        studentId: auth.student.id,
        progress,
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
