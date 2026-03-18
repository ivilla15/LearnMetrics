import { z } from 'zod';
import { OPERATION_CODES } from '@/types/enums';

const operationSchema = z.enum(OPERATION_CODES);

export const bulkAddStudentsSchema = z.object({
  defaultStartingOperation: operationSchema.optional(),
  defaultStartingLevel: z.coerce.number().int().min(1).max(100).optional(),

  defaultLevel: z.coerce.number().int().min(1).max(100).optional(),

  students: z
    .array(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        username: z.string().min(1),

        level: z.coerce.number().int().min(1).max(100).optional(),

        startingOperation: operationSchema.optional(),
        startingLevel: z.coerce.number().int().min(1).max(100).optional(),
      }),
    )
    .min(1)
    .max(200),
});

export type BulkAddStudentsRequest = z.infer<typeof bulkAddStudentsSchema>;

export const deleteAllStudentsSchema = z.object({
  deleteAssignments: z.boolean().optional().default(false),
  deleteSchedules: z.boolean().optional().default(false),
});

export type DeleteAllStudentsRequest = z.infer<typeof deleteAllStudentsSchema>;
