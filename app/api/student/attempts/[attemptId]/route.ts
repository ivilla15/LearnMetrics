import { NextResponse } from 'next/server';

import { prisma } from '@/data/prisma';
import { requireStudent } from '@/core';
import { jsonError, parseId } from '@/utils';
import { handleApiError } from '@/app';
import type { StudentAttemptRouteContext } from '@/app/api/_shared/route-types';

export async function GET(_req: Request, { params }: StudentAttemptRouteContext) {
  try {
    const auth = await requireStudent();
    if (!auth.ok) return jsonError(auth.error, auth.status);
    const student = auth.student;

    const { attemptId: rawAttemptId } = await params;
    const attemptId = parseId(rawAttemptId);
    if (!attemptId) return jsonError('Invalid attempt id', 400);

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

    // Ownership enforcement (critical)
    if (attempt.studentId !== student.id) return jsonError('Not allowed', 403);

    // completedAt is nullable now; a non-completed attempt shouldn't be viewable as a result
    if (!attempt.completedAt) return jsonError('Attempt not completed', 409);

    const percent = attempt.total > 0 ? Math.round((attempt.score / attempt.total) * 100) : 0;
    const wasMastery = attempt.total > 0 && attempt.score === attempt.total;

    return NextResponse.json(
      {
        attemptId: attempt.id,
        studentId: attempt.studentId,
        assignmentId: attempt.assignmentId,
        completedAt: attempt.completedAt.toISOString(),
        // Do NOT fall back to current student progress for historical results.
        // If older attempts didn't store it, return null and optionally backfill later.
        levelAtTime: attempt.levelAtTime ?? null,
        score: attempt.score,
        total: attempt.total,
        percent,
        wasMastery,
        assignment: attempt.Assignment
          ? {
              type: attempt.Assignment.type,
              mode: attempt.Assignment.mode,
              opensAt: attempt.Assignment.opensAt.toISOString(),
              closesAt: attempt.Assignment.closesAt
                ? attempt.Assignment.closesAt.toISOString()
                : null,
              windowMinutes: attempt.Assignment.windowMinutes,
            }
          : null,
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
