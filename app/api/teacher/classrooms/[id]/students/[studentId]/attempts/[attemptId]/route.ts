import { NextResponse } from 'next/server';
import { prisma } from '@/data/prisma';
import { requireTeacher } from '@/core/auth/requireTeacher';

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseId(raw: string | undefined) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

type RouteCtx = {
  params: Promise<{ id: string; studentId: string; attemptId: string }>;
};

export async function GET(_req: Request, { params }: RouteCtx) {
  const auth = await requireTeacher();
  if (!auth.ok) return jsonError(auth.error, auth.status);
  const teacher = auth.teacher;

  const { id: rawClassroomId, studentId: rawStudentId, attemptId: rawAttemptId } = await params;

  const classroomId = parseId(rawClassroomId);
  const studentId = parseId(rawStudentId);
  const attemptId = parseId(rawAttemptId);

  if (!classroomId) return jsonError('Invalid classroom id', 400);
  if (!studentId) return jsonError('Invalid student id', 400);
  if (!attemptId) return jsonError('Invalid attempt id', 400);

  // Authorization: teacher must own classroom
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, teacherId: teacher.id },
    select: { id: true },
  });
  if (!classroom) return jsonError('Not allowed', 403);

  // Ensure student belongs to classroom (also gives fallback level)
  const student = await prisma.student.findFirst({
    where: { id: studentId, classroomId },
    select: { id: true, level: true },
  });
  if (!student) return jsonError('Student not found', 404);

  // Attempt must belong to the student and classroom
  const attempt = await prisma.attempt.findFirst({
    where: {
      id: attemptId,
      studentId,
      Assignment: { classroomId },
    },
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
          kind: true,
          assignmentMode: true,
          opensAt: true,
          closesAt: true,
          windowMinutes: true,
        },
      },
      AttemptItem: {
        orderBy: { id: 'asc' },
        select: {
          id: true,
          givenAnswer: true,
          isCorrect: true,
          Question: {
            select: { factorA: true, factorB: true, answer: true },
          },
        },
      },
    },
  });

  if (!attempt) return jsonError('Attempt not found', 404);

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
        kind: attempt.Assignment.kind,
        assignmentMode: attempt.Assignment.assignmentMode,
        opensAt: attempt.Assignment.opensAt.toISOString(),
        closesAt: attempt.Assignment.closesAt.toISOString(),
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
}
