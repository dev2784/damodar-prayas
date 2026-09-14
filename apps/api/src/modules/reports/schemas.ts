import { z } from 'zod';

export const reportReasonSchema = z.enum([
  'FAKE_PROFILE',
  'WRONG_INFORMATION',
  'INAPPROPRIATE_CONTENT',
  'DUPLICATE_PROFILE',
  'SPAM',
  'OTHER',
]);

export const createProfileReportSchema = z.object({
  profileId: z.string().trim().min(1),
  reason: reportReasonSchema,
  details: z.string().trim().min(3).max(2000).optional(),
}).superRefine((data, ctx) => {
  if (data.reason === 'OTHER' && !data.details) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['details'],
      message: 'Details are required when reason is OTHER',
    });
  }
});

export const myReportsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
