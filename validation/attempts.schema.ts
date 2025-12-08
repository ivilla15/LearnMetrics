// src/validation/attempts.schema.ts
import { z } from 'zod';

// One answer from the student
const answerSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  givenAnswer: z.coerce.number().int(), // can be negative if they really try, but we don't care
});

// Whole submission
export const submitAttemptSchema = z.object({
  studentId: z.coerce.number().int().positive(),
  assignmentId: z.coerce.number().int().positive(),
  answers: z.array(answerSchema).min(1, 'At least one answer is required'),
});

export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;
