// app/api/admin/scheduler/run/route.ts

import { runActiveSchedulesForDate } from '@/core/schedules/service';
import { jsonResponse, errorResponse } from '@/utils/http';
import { timingSafeEqual } from 'crypto';

function isAuthorized(request: Request): boolean {
  const secret = process.env.SCHEDULER_SECRET;
  if (!secret) return false;

  const auth = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;

  // constant-time compare (avoid leaking info via timing)
  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const results = await runActiveSchedulesForDate(new Date());
    return jsonResponse(
      {
        ranAt: new Date().toISOString(),
        createdAssignments: results,
      },
      200,
    );
  } catch {
    return errorResponse('Internal server error', 500);
  }
}
