import { z } from 'zod';
import { OPERATION_CODES } from '@/types/enums';

const operationSchema = z.enum(OPERATION_CODES);

export const getPracticeQuestionsQuerySchema = z.object({
  operation: operationSchema.optional(),
  level: z.coerce.number().int().min(1).max(100).optional(),
  count: z.coerce.number().int().min(1).max(200).optional(),
});

export type GetPracticeQuestionsQuery = z.infer<typeof getPracticeQuestionsQuerySchema>;

export const gradePracticeBodySchema = z.object({
  operation: operationSchema,
  level: z.coerce.number().int().min(1).max(100),

  answers: z
    .array(
      z.object({
        questionId: z.coerce.number().int().positive(),
        givenAnswer: z.union([z.number(), z.string(), z.null()]),
      }),
    )
    .min(1),
});

export type GradePracticeBody = z.infer<typeof gradePracticeBodySchema>;
