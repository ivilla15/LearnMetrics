import { z } from 'zod';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth';
import { assertTeacherOwnsClassroom } from '@/core/classrooms/ownership';
import { recomputeStudentProgressionFromValidAttempts } from '@/core/progression/recompute.service';
import { handleApiError, readJson, type RouteContext } from '@/app/api/_shared';
import { errorResponse, jsonResponse, parseId } from '@/utils';

type Ctx = RouteContext<{ id: string; assignmentId: string; attemptId: string }>;

const reviewBodySchema = z.object({
  reviewStatus: z.enum(['VALID', 'FLAGGED', 'INVALIDATED']),
  reviewNote: z.string().max(500).optional().nullable(),
});

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, assignmentId, attemptId } = await params;
    const classroomId = parseId(id);
    const aid = parseId(assignmentId);
    const attId = parseId(attemptId);

    if (!classroomId) return errorResponse('Invalid classroom id', 400);
    if (!aid) return errorResponse('Invalid assignment id', 400);
    if (!attId) return errorResponse('Invalid attempt id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const attempt = await prisma.attempt.findFirst({
      where: { id: attId, assignmentId: aid },
      select: {
        id: true,
        studentId: true,
        score: true,
        total: true,
        completedAt: true,
        startedAt: true,
        reviewStatus: true,
        reviewedByTeacherId: true,
        reviewedAt: true,
        reviewNote: true,
        Student: { select: { id: true, name: true, username: true, classroomId: true } },
        Assignment: { select: { classroomId: true } },
      },
    });

    if (!attempt) return errorResponse('Attempt not found', 404);
    if (attempt.Assignment.classroomId !== classroomId) return errorResponse('Not allowed', 403);

    const events = await prisma.attemptEvent.findMany({
      where: { assignmentId: aid, studentId: attempt.studentId },
      orderBy: [{ occurredAt: 'asc' }, { id: 'asc' }],
      select: { id: true, eventType: true, occurredAt: true },
    });

    return jsonResponse(
      {
        attemptId: attempt.id,
        studentId: attempt.studentId,
        completedAt: attempt.completedAt?.toISOString() ?? null,
        startedAt: attempt.startedAt.toISOString(),
        score: attempt.score,
        total: attempt.total,
        student: attempt.Student,
        reviewStatus: attempt.reviewStatus,
        reviewedByTeacherId: attempt.reviewedByTeacherId,
        reviewedAt: attempt.reviewedAt?.toISOString() ?? null,
        reviewNote: attempt.reviewNote ?? null,
        events: events.map((e) => ({
          id: e.id,
          eventType: e.eventType,
          occurredAt: e.occurredAt.toISOString(),
        })),
      },
      200,
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return errorResponse(auth.error, auth.status);

    const { id, assignmentId, attemptId } = await params;
    const classroomId = parseId(id);
    const aid = parseId(assignmentId);
    const attId = parseId(attemptId);

    if (!classroomId) return errorResponse('Invalid classroom id', 400);
    if (!aid) return errorResponse('Invalid assignment id', 400);
    if (!attId) return errorResponse('Invalid attempt id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    const body = await readJson(req);
    const { reviewStatus, reviewNote } = reviewBodySchema.parse(body);

    const attempt = await prisma.attempt.findFirst({
      where: { id: attId, assignmentId: aid },
      select: {
        id: true,
        studentId: true,
        reviewStatus: true,
        Student: { select: { classroomId: true } },
        Assignment: { select: { classroomId: true } },
      },
    });

    if (!attempt) return errorResponse('Attempt not found', 404);
    if (attempt.Assignment.classroomId !== classroomId) return errorResponse('Not allowed', 403);

    const prevStatus = attempt.reviewStatus;

    await prisma.attempt.update({
      where: { id: attId },
      data: {
        reviewStatus,
        reviewedByTeacherId: auth.teacher.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote ?? null,
      },
    });

    const wasInvalidated = prevStatus === 'INVALIDATED';
    const isNowInvalidated = reviewStatus === 'INVALIDATED';
    if (wasInvalidated !== isNowInvalidated) {
      await recomputeStudentProgressionFromValidAttempts({
        studentId: attempt.studentId,
        classroomId: attempt.Student.classroomId,
      });
    }

    return jsonResponse({ ok: true, reviewStatus }, 200);
  } catch (err: unknown) {
    return handleApiError(err);
  }
}
