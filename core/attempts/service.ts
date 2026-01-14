import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import type { SubmitAttemptBody } from '@/validation/attempts.schema';

import * as AssignmentsRepo from '@/data/assignments.repo';
import * as StudentsRepo from '@/data/students.repo';
import * as QuestionsRepo from '@/data/questions.repo';
import * as AttemptsRepo from '@/data/attempts.repo';

import { NotFoundError, ConflictError } from '@/core/errors';

export type AttemptResultDTO = {
  assignmentId: number;
  studentId: number;
  score: number;
  total: number;
  percent: number;
  wasMastery: boolean;
};

export type SubmitAttemptInput = SubmitAttemptBody & {
  studentId: number;
};

export async function submitAttempt(params: SubmitAttemptInput): Promise<AttemptResultDTO> {
  const { studentId, assignmentId, answers } = params;

  // 1) Load assignment
  const assignment = await AssignmentsRepo.findAssignmentById(assignmentId);
  if (!assignment) {
    throw new NotFoundError('Assignment not found');
  }

  const now = new Date();
  if (now < assignment.opensAt) {
    throw new ConflictError('This assignment is not open yet');
  }
  if (now > assignment.closesAt) {
    throw new ConflictError('This assignment is already closed');
  }

  // 2) Load student
  const student = await StudentsRepo.findStudentById(studentId);
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // 3) Load questions
  const questionIds = answers.map((a) => a.questionId);
  const questions = await QuestionsRepo.findByIds(questionIds);

  if (questions.length === 0) {
    throw new NotFoundError('No questions found for this submission');
  }

  const correctById = new Map<number, number>();
  for (const q of questions) {
    correctById.set(q.id, q.answer);
  }

  // 4) Score
  let score = 0;
  const total = answers.length;

  const itemsPayload: {
    questionId: number;
    givenAnswer: number;
    isCorrect: boolean;
  }[] = [];

  for (const ans of answers) {
    const correctAnswer = correctById.get(ans.questionId);
    const isCorrect = correctAnswer !== undefined && ans.givenAnswer === correctAnswer;

    if (isCorrect) score += 1;

    itemsPayload.push({
      questionId: ans.questionId,
      givenAnswer: ans.givenAnswer,
      isCorrect,
    });
  }

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const wasMastery = score === total;

  // 5) Insert attempt + items
  try {
    const attempt = await AttemptsRepo.createAttempt({
      studentId,
      assignmentId,
      score,
      total,
    });

    await AttemptsRepo.createAttemptItems(
      itemsPayload.map((item) => ({
        attemptId: attempt.id,
        questionId: item.questionId,
        givenAnswer: item.givenAnswer,
        isCorrect: item.isCorrect,
      })),
    );

    return {
      assignmentId,
      studentId,
      score,
      total,
      percent,
      wasMastery,
    };
  } catch (err) {
    if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new ConflictError('Student has already submitted an attempt for this assignment');
    }
    throw err;
  }
}
