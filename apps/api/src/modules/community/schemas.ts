import { z } from 'zod';

export const postCategorySchema = z.enum([
  'NEWS',
  'EVENT',
  'ADVERTISEMENT',
  'REQUEST',
  'GRATITUDE',
  'WISHES',
  'OBITUARY',
]);

const translationSchema = z.object({
  language: z.enum(['HI', 'EN']),
  title: z.string().trim().min(1).max(200),
  details: z.string().trim().min(1).max(5000),
});

export const submitCommunityPostSchema = z.object({
  category: postCategorySchema,
  bannerUrl: z.string().url().optional().nullable(),
  bannerStorageKey: z.string().trim().max(500).optional().nullable(),
  contactName: z.string().trim().max(150).optional().nullable(),
  contactPhone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/).optional().nullable(),
  location: z.string().trim().max(300).optional().nullable(),
  eventDate: z.coerce.date().optional().nullable(),
  obituaryType: z.enum(['DEATH_NOTICE', 'UTHAWNA', 'CHAUTHA', 'TRIBUTE', 'OTHER']).optional().nullable(),
  deceasedName: z.string().trim().max(200).optional().nullable(),
  deathDate: z.coerce.date().optional().nullable(),
  eventTime: z.string().trim().max(50).optional().nullable(),
  expiresAt: z.coerce.date().optional().nullable(),
  translations: z.array(translationSchema).min(1).max(2).superRefine((translations, ctx) => {
    const languages = translations.map((item) => item.language);
    if (new Set(languages).size !== languages.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Each language can be provided only once.' });
    }
  }),
}).refine(
  (data) => !data.expiresAt || !data.eventDate || data.expiresAt >= data.eventDate,
  { message: 'expiresAt must be on or after eventDate', path: ['expiresAt'] },
);

export const communityPostListQuerySchema = z.object({
  category: postCategorySchema.optional(),
  language: z.enum(['HI', 'EN']).default('HI'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
