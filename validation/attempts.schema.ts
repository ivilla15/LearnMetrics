import { z } from 'zod';

const answerSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  givenAnswer: z.coerce.number().int(),
});

// Body shape sent by the client (no studentId)
export const submitAttemptSchema = z.object({
  assignmentId: z.coerce.number().int().positive(),
  answers: z.array(answerSchema).min(1, 'At least one answer is required'),
});

export type SubmitAttemptBody = z.infer<typeof submitAttemptSchema>;
