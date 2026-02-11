import { NextResponse } from 'next/server';

import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core';
import { jsonError, parseId } from '@/utils';
import { handleApiError } from '@/app';
import { assertTeacherOwnsClassroom } from '@/core/classrooms';

type RouteCtx = { params: Promise<{ id: string; studentId: string; attemptId: string }> };

export async function GET(_req: Request, { params }: RouteCtx) {
  try {
    const auth = await requireTeacher();
    if (!auth.ok) return jsonError(auth.error, auth.status);

    const { id, studentId, attemptId: rawAttemptId } = await params;

    const classroomId = parseId(id);
    if (!classroomId) return jsonError('Invalid classroom id', 400);

    const sid = parseId(studentId);
    if (!sid) return jsonError('Invalid student id', 400);

    const attemptId = parseId(rawAttemptId);
    if (!attemptId) return jsonError('Invalid attempt id', 400);

    await assertTeacherOwnsClassroom(auth.teacher.id, classroomId);

    // Ensure student belongs to classroom (and grab level for fallback)
    const student = await prisma.student.findFirst({
      where: { id: sid, classroomId },
      select: { id: true, level: true },
    });
    if (!student) return jsonError('Student not found', 404);

    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId },
      select: {
        id: true,
        studentId: true,
        assignmentId: true,
        score: true,
        total: true,
        completedAt: true,
        levelAtTime: true,
        Assignment: {
          select: {
            type: true,
            mode: true,
            opensAt: true,
            closesAt: true,
            windowMinutes: true,
          },
        },
        AttemptItem: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            questionId: true,
            givenAnswer: true,
            isCorrect: true,
            Question: {
              select: {
                factorA: true,
                factorB: true,
                answer: true,
              },
            },
          },
        },
      },
    });

    if (!attempt) return jsonError('Attempt not found', 404);

    // Ownership enforcement (teacher scope): attempt must belong to this student
    if (attempt.studentId !== student.id) return jsonError('Not allowed', 403);

    // Attempts may exist with completedAt null (in-progress); this endpoint expects completed attempts.
    if (!attempt.completedAt) return jsonError('Attempt not completed', 409);

    const percent = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
    const wasMastery = attempt.total > 0 && attempt.score === attempt.total;

    return NextResponse.json(
      {
        attemptId: attempt.id,
        studentId: attempt.studentId,
        assignmentId: attempt.assignmentId,
        completedAt: attempt.completedAt.toISOString(),
        levelAtTime: attempt.levelAtTime ?? student.level,
        score: attempt.score,
        total: attempt.total,
        percent,
        wasMastery,
        assignment: {
          type: attempt.Assignment.type,
          mode: attempt.Assignment.mode,
          opensAt: attempt.Assignment.opensAt.toISOString(),
          closesAt: attempt.Assignment.closesAt ? attempt.Assignment.closesAt.toISOString() : null,
          windowMinutes: attempt.Assignment.windowMinutes,
        },
        items: attempt.AttemptItem.map((it) => ({
          id: it.id,
          prompt: `${it.Question.factorA} × ${it.Question.factorB}`,
          studentAnswer: it.givenAnswer,
          correctAnswer: it.Question.answer,
          isCorrect: it.isCorrect,
        })),
      },
      { status: 200 },
    );
  } catch (err: unknown) {
    return handleApiError(err);
  }
}