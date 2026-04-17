import { z } from 'zod';
import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core/auth';
import { handleApiError, readJson, type RouteContext } from '@/app/api/_shared';
import { errorResponse, jsonResponse, parseId } from '@/utils';
import { studentCanAccessAssignment } from '@/core';

const eventTypeSchema = z.enum([
  'TAB_HIDDEN',
  'WINDOW_BLUR',
  'LEFT_PAGE',
  'COPY_BLOCKED',
  'CUT_BLOCKED',
  'PASTE_BLOCKED',
]);

const bodySchema = z.object({
  eventType: eventTypeSchema,
});

type Ctx = RouteContext<{ id: string }>;

export async function POST(req: Request, { params }: Ctx) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id } = await params;
    const assignmentId = parseId(id);
    if (!assignmentId) return errorResponse('Invalid assignment id', 400);

    const body = await readJson(req);
    const { eventType } = bodySchema.parse(body);

    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, classroomId: true, recipients: { select: { studentId: true } } },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);
    if (!studentCanAccessAssignment({ assignment, student: auth.student })) {
      return errorResponse('Not allowed', 403);
    }

    await prisma.attemptEvent.create({
      data: {
        studentId: auth.student.id,
        assignmentId,
        eventType,
      },
    });

    return jsonResponse({ ok: true }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
