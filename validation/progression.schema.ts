import { z } from 'zod';
import { DOMAIN_CODES, type DomainCode } from '@/types/domain';

const domainSchema = z
  .string()
  .refine((v): v is DomainCode => (DOMAIN_CODES as readonly string[]).includes(v), 'Invalid domain code');

function unique<T>(arr: T[]) {
  return new Set(arr).size === arr.length;
}

export const upsertProgressionPolicySchema = z.object({
  enabledDomains: z
    .array(domainSchema)
    .min(1)
    .refine(unique, 'Duplicate enabledDomains not allowed'),
  maxNumber: z.coerce.number().int().min(1).max(100),
});

export type UpsertProgressionPolicyInput = z.infer<typeof upsertProgressionPolicySchema>;

export const upsertStudentProgressSchema = z.object({
  levels: z
    .array(
      z.object({
        domain: domainSchema,
        level: z.coerce.number().int().min(0).max(100),
      }),
    )
    .min(1)
    .refine((rows) => unique(rows.map((r) => r.domain)), 'Duplicate domains in levels'),
});

export type UpsertStudentProgressInput = z.infer<typeof upsertStudentProgressSchema>;
