import { SubmitAttemptBody } from '@/validation/attempts.schema';
import * as AssignmentsRepo from '@/data/assignments.repo';
import * as StudentRepo from '@/data/students.repo';
import * as QuestionsRepo from '@/data/questions.repo';
import * as AttemptsRepo from '@/data/attempts.repo';
import { NotFoundError, ConflictError } from '@/core/errors';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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
  // 1) Load assignment, ensure exists
  const assignment = await AssignmentsRepo.findById(assignmentId);
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
  // 2) Load student, ensure exists
  const student = await StudentRepo.findById(studentId);
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  // 3) Load questions for the assignment's question set
  const questions = await QuestionsRepo.findByQuestionSetId(assignment.questionSetId);
  if (questions.length === 0) {
    throw new NotFoundError('No questions found for this assignment');
  }

  const correctById = new Map<number, number>();
  for (const q of questions) {
    correctById.set(q.id, q.answer);
  }

  // 4) Score the submission (score, total, percent, wasMastery)
  let score = 0;
  const total = answers.length;

  const itemsPayload: {
    questionId: number;
    givenAnswer: number;
    isCorrect: boolean;
  }[] = [];

  for (const ans of answers) {
    const correctAnswer = correctById.get(ans.questionId);
    const isCorrect = correctAnswer != undefined && ans.givenAnswer === correctAnswer;

    if (correctAnswer !== undefined && ans.givenAnswer === correctAnswer) {
      score++;
    }

    itemsPayload.push({
      questionId: ans.questionId,
      givenAnswer: ans.givenAnswer,
      isCorrect,
    });
  }

  const percent = total > 0 ? Math.round((score / total) * 100) : 0;
  const wasMastery = score === total;

  // 5) Insert Attempt
  try {
    const attempt = await AttemptsRepo.createAttempt({
      studentId,
      assignmentId,
      score,
      total,
    });

    // 6) Insert AttemptItems
    await AttemptsRepo.createAttemptItems(
      itemsPayload.map((item) => ({
        attemptId: attempt.id,
        questionId: item.questionId,
        givenAnswer: item.givenAnswer,
        isCorrect: item.isCorrect,
      })),
    );
    // 7) Return AttemptResultDTO

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
