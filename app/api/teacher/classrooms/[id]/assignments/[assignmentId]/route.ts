import { prisma } from '@/data/prisma';
import type { Prisma } from '@prisma/client';
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
        scheduleId: true,
        runDate: true,
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
    const data: Prisma.AssignmentUpdateInput = {};
    if (input.opensAt) data.opensAt = new Date(input.opensAt);
    if (input.closesAt) data.closesAt = new Date(input.closesAt);
    if (input.windowMinutes !== undefined) data.windowMinutes = input.windowMinutes;
    if (input.numQuestions !== undefined) data.numQuestions = input.numQuestions;

    // Optional: validate opensAt < closesAt when both provided (uncomment if desired)
    if (data.opensAt && data.closesAt && (data.closesAt as Date) <= (data.opensAt as Date)) {
      return errorResponse('closesAt must be after opensAt', 400);
    }

    // If nothing provided
    if (Object.keys(data).length === 0) {
      return errorResponse('No fields provided', 400);
    }

    const nextOpensAt =
      typeof data.opensAt === 'object' && data.opensAt instanceof Date ? data.opensAt : null;

    const isChangingOpensAt = nextOpensAt
      ? assignment.opensAt.getTime() !== nextOpensAt.getTime()
      : false;

    if (isChangingOpensAt && assignment.scheduleId && assignment.runDate) {
      await prisma.assignmentScheduleRun.update({
        where: {
          scheduleId_runDate: {
            scheduleId: assignment.scheduleId,
            runDate: assignment.runDate,
          },
        },
        data: {
          isSkipped: true,
          skippedAt: new Date(),
          skipReason: 'Rescheduled by teacher',
          assignmentId: null,
        },
      });
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
      // removed opensAt here (not needed)
      select: { id: true, scheduleId: true, runDate: true },
    });

    if (!assignment) return errorResponse('Assignment not found', 404);

    const attemptCount = await prisma.attempt.count({ where: { assignmentId: aId } });
    if (attemptCount > 0) {
      return errorResponse('Cannot delete an assignment that already has attempts', 409);
    }

    // If this assignment was created by a schedule run, mark the run as skipped (upsert safe)
    if (assignment.scheduleId && assignment.runDate) {
      await prisma.assignmentScheduleRun.upsert({
        where: {
          scheduleId_runDate: {
            scheduleId: assignment.scheduleId,
            runDate: assignment.runDate,
          },
        },
        update: {
          isSkipped: true,
          skippedAt: new Date(),
          // you already store skipReason elsewhere, but if you have the field add it here:
          skipReason: 'Deleted by teacher',
          assignmentId: null,
        },
        create: {
          scheduleId: assignment.scheduleId,
          runDate: assignment.runDate,
          isSkipped: true,
          skippedAt: new Date(),
          skipReason: 'Deleted by teacher',
          assignmentId: null,
        },
      });
    }

    await prisma.assignment.delete({ where: { id: aId } });

    return new Response(null, { status: 204 });
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
