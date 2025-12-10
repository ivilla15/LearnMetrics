// app/api/admin/scheduler/run/route.ts

import { runSchedulesForDate } from '@/core/schedules/service';
import { jsonResponse, errorResponse } from '@/utils/http';
import { requireTeacher, AuthError } from '@/core/auth';

export async function POST(request: Request) {
  try {
    // Only teachers can manually run the scheduler
    const teacher = await requireTeacher(request);

    // Optionally: verify this teacher is an "admin" later.
    // For now, any teacher can trigger scheduler.

    const results = await runSchedulesForDate(new Date());

    return jsonResponse(
      {
        ranAt: new Date().toISOString(),
        createdAssignments: results,
      },
      200,
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, 401);
    }

    // Any unexpected error
    return errorResponse('Internal server error', 500);
  }
}
