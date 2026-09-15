import { z } from 'zod';

export const committeeTranslationSchema = z.object({
  language: z.enum(['HI', 'EN']),
  name: z.string().trim().min(1).max(200),
  details: z.string().trim().max(5000).optional(),
});

export const committeeMemberSchema = z.object({
  name: z.string().trim().min(1).max(150),
  designationHi: z.string().trim().max(150).optional(),
  designationEn: z.string().trim().max(150).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().max(254).optional(),
  photoUrl: z.string().url().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const committeeBaseSchema = z.object({
  bannerUrl: z.string().url(),
  bannerStorageKey: z.string().trim().max(500).optional(),
  logoUrl: z.string().url().optional(),
  city: z.string().trim().min(1).max(120),
  district: z.string().trim().max(120).optional(),
  state: z.string().trim().min(1).max(120),
  address: z.string().trim().max(1000).optional(),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().max(254).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0),
  translations: z.array(committeeTranslationSchema).min(1).max(2),
  members: z.array(committeeMemberSchema).max(100).default([]),
});

function validateUniqueTranslations(
  value: { translations?: Array<{ language: 'HI' | 'EN' }> },
  ctx: z.RefinementCtx,
) {
  if (!value.translations) return;
  const languages = value.translations.map((translation) => translation.language);
  if (new Set(languages).size !== languages.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['translations'],
      message: 'Duplicate translation language is not allowed',
    });
  }
}

export const createCommitteeSchema = committeeBaseSchema.superRefine(validateUniqueTranslations);

export const submitCommitteeSchema = committeeBaseSchema
  .omit({ isActive: true, sortOrder: true })
  .superRefine(validateUniqueTranslations);

export const updateCommitteeSchema = committeeBaseSchema.partial().superRefine(validateUniqueTranslations);

export const committeeListQuerySchema = z.object({
  state: z.string().trim().optional(),
  district: z.string().trim().optional(),
  city: z.string().trim().optional(),
  language: z.enum(['HI', 'EN']).default('HI'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
