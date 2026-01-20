import crypto from 'crypto';

import { runActiveSchedulesForDate } from '@/core/schedules/service';
import { jsonResponse, errorResponse } from '@/utils/http';
import { handleApiError } from '@/app';

function isAuthorized(request: Request): boolean {
  const secret = process.env.SCHEDULER_SECRET;
  if (!secret || secret.length === 0) return false;

  const auth = request.headers.get('authorization') ?? '';
  const prefix = 'Bearer ';
  if (!auth.startsWith(prefix)) return false;

  const provided = auth.slice(prefix.length);

  try {
    // Hash both to fixed-length buffers then compare in constant time.
    const hExpected = crypto.createHash('sha256').update(secret, 'utf8').digest();
    const hProvided = crypto.createHash('sha256').update(provided, 'utf8').digest();

    // Both are 32 bytes — safe to timingSafeEqual
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
