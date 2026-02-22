import crypto from 'crypto';

import { runActiveSchedulesForDate } from '@/core';
import { handleApiError } from '@/app/api/_shared/handle-error';
import { jsonResponse, errorResponse } from '@/utils/http';

function isAuthorized(request: Request): boolean {
  const secret = process.env.SCHEDULER_SECRET;
  if (!secret) return false;

  const auth = request.headers.get('authorization') ?? '';
  const prefix = 'Bearer ';
  if (!auth.startsWith(prefix)) return false;

  const provided = auth.slice(prefix.length);

  try {
    // Hash both to fixed-length buffers then compare in constant time.
    const hExpected = crypto.createHash('sha256').update(secret, 'utf8').digest();
    const hProvided = crypto.createHash('sha256').update(provided, 'utf8').digest();

    return crypto.timingSafeEqual(hExpected, hProvided);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const now = new Date();
    const results = await runActiveSchedulesForDate(now);

    return jsonResponse(
      {
        ranAt: now.toISOString(),
        createdAssignments: results,
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err, { defaultMessage: 'Internal server error', defaultStatus: 500 });
  }
}
