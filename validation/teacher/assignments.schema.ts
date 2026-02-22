import { z } from 'zod';
import { createManualAssignmentRequestBaseSchema } from '../assignments.schema';

const idSchema = z.coerce.number().int().positive();

export const createTeacherAssignmentBodySchema = createManualAssignmentRequestBaseSchema
  .extend({
    scheduleId: idSchema.nullable().optional(),
    runDate: z.string().datetime().nullable().optional(),
  })
  .superRefine(
    (
      v: z.infer<typeof createManualAssignmentRequestBaseSchema> & {
        scheduleId?: number | null;
        runDate?: string | null;
      },
      ctx: z.RefinementCtx,
    ) => {
      const hasSchedule = typeof v.scheduleId === 'number';

      if (hasSchedule && !v.runDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'runDate is required when scheduleId is provided',
          path: ['runDate'],
        });
      }

      if (!hasSchedule && v.runDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'runDate is only valid when scheduleId is provided',
          path: ['runDate'],
        });
      }
    },
  );

export type CreateTeacherAssignmentBody = z.infer<typeof createTeacherAssignmentBodySchema>;
