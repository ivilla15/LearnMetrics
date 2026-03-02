import { z } from 'zod';
import { requireTeacher } from '@/core/auth';
import { classroomIdParamSchema } from '@/validation';
import { errorResponse, jsonResponse } from '@/utils/http';
import { handleApiError, type RouteContext } from '@/app';
import type { ClassroomProgressDTO } from '@/types';

import { getClassroomProgress } from '@/core/';

export async function GET(req: Request, { params }: RouteContext<{ id: string }>) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const { id: classroomId } = classroomIdParamSchema.parse({ id });

    const url = new URL(req.url);
    const days = Number(url.searchParams.get('days') ?? '30') || 30;
    const primaryOperation = url.searchParams.get('primaryOperation') ?? undefined;

    const dto = await getClassroomProgress({
      teacherId: auth.teacher.id,
      classroomId,
      days,
      primaryOperation: primaryOperation as 'ADD' | 'SUB' | 'MUL' | 'DIV' | undefined,
    });

    return jsonResponse(dto as ClassroomProgressDTO, 200);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) return errorResponse('Invalid request', 400);
    return handleApiError(err, {
      defaultMessage: 'Failed to load classroom progress',
      defaultStatus: 500,
    });
  }
}
