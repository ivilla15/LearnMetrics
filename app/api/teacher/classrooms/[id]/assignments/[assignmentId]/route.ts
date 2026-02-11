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
        type: true,
        mode: true,
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

    // closesAt is nullable in schema, so support explicit null when provided
    if (Object.prototype.hasOwnProperty.call(input, 'closesAt')) {
      data.closesAt = input.closesAt ? new Date(input.closesAt) : null;
    }

    if (input.windowMinutes !== undefined) data.windowMinutes = input.windowMinutes;
    if (input.numQuestions !== undefined) data.numQuestions = input.numQuestions;

    // Validate opensAt < closesAt when both are present as dates
    const nextOpensAt =
      data.opensAt instanceof Date ? data.opensAt : assignment.opensAt instanceof Date ? assignment.opensAt : null;

    const nextClosesAt =
      data.closesAt instanceof Date
        ? data.closesAt
        : data.closesAt === null
          ? null
          : assignment.closesAt ?? null;

    if (nextOpensAt && nextClosesAt && nextClosesAt.getTime() <= nextOpensAt.getTime()) {
      return errorResponse('closesAt must be after opensAt', 400);
    }

    // If nothing provided
    if (Object.keys(data).length === 0) {
      return errorResponse('No fields provided', 400);
    }

    const isChangingOpensAt =
      data.opensAt instanceof Date ? assignment.opensAt.getTime() !== data.opensAt.getTime() : false;

    // If rescheduling a scheduled assignment occurrence, mark the original run as skipped
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
        type: true,
        mode: true,
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
          type: updated.type,
          mode: updated.mode,
          opensAt: updated.opensAt.toISOString(),
          closesAt: updated.closesAt ? updated.closesAt.toISOString() : null,
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