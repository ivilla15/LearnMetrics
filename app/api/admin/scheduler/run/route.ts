import crypto from 'crypto';

import { runActiveSchedulesForDate } from '@/core/schedules/service';
import { jsonResponse, errorResponse } from '@/utils/http';
import { handleApiError } from '@/app';

function isAuthorized(request: Request): boolean {
  const secret = process.env.SCHEDULER_SECRET;
  if (!secret) return false;

  const auth = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;

  const a = Buffer.from(auth);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
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
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
