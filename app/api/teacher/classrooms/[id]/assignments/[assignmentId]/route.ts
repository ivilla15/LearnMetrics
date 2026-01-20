import { prisma } from '@/data/prisma';

import { requireTeacher } from '@/core';
import { errorResponse, jsonResponse, parseId } from '@/utils';
import { handleApiError, readJson, type ClassroomAssignmentRouteContext } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';
import { updateTeacherAssignmentSchema } from '@/validation';

export async function PATCH(req: Request, { params }: ClassroomAssignmentRouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, assignmentId } = await params;

    const classroomId = parseId(id);
    if (!classroomId) return errorResponse('Invalid classroom id', 400);

    const aId = parseId(assignmentId);
    if (!aId) return errorResponse('Invalid assignment id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const assignment = await prisma.assignment.findFirst({
      where: { id: aId, classroomId },
      select: {
        id: true,
        kind: true,
        assignmentMode: true,
        opensAt: true,
        closesAt: true,
        windowMinutes: true,
        numQuestions: true,
      },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);

    const attemptCount = await prisma.attempt.count({ where: { assignmentId: aId } });
    if (attemptCount > 0) {
      return errorResponse('Cannot edit an assignment that already has attempts', 409);
    }

    const body = await readJson(req);
    const input = updateTeacherAssignmentSchema.parse(body);

    // Build Prisma update data
    const data: Record<string, unknown> = {};
    if (input.opensAt) data.opensAt = new Date(input.opensAt);
    if (input.closesAt) data.closesAt = new Date(input.closesAt);
    if (input.windowMinutes !== undefined) data.windowMinutes = input.windowMinutes;
    if (input.numQuestions !== undefined) data.numQuestions = input.numQuestions;

    // If nothing provided
    if (Object.keys(data).length === 0) {
      return errorResponse('No fields provided', 400);
    }

    const updated = await prisma.assignment.update({
      where: { id: aId },
      data,
      select: {
        id: true,
        kind: true,
        assignmentMode: true,
        opensAt: true,
        closesAt: true,
        windowMinutes: true,
        numQuestions: true,
      },
    });

    return jsonResponse(
      {
        assignment: {
          assignmentId: updated.id,
          kind: updated.kind,
          assignmentMode: updated.assignmentMode,
          opensAt: updated.opensAt.toISOString(),
          closesAt: updated.closesAt.toISOString(),
          windowMinutes: updated.windowMinutes,
          numQuestions: updated.numQuestions ?? 12,
        },
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: ClassroomAssignmentRouteContext) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, assignmentId } = await params;

    const classroomId = parseId(id);
    if (!classroomId) return errorResponse('Invalid classroom id', 400);

    const aId = parseId(assignmentId);
    if (!aId) return errorResponse('Invalid assignment id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const assignment = await prisma.assignment.findFirst({
      where: { id: aId, classroomId },
      select: { id: true },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);

    const attemptCount = await prisma.attempt.count({ where: { assignmentId: aId } });
    if (attemptCount > 0) {
      return errorResponse('Cannot delete an assignment that already has attempts', 409);
    }

    await prisma.assignment.delete({ where: { id: aId } });

    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
