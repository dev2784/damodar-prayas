import { z } from 'zod';

export const darziCategorySchema = z.enum(['JUNA_GUJARATI', 'PIPA', 'NAMDEV']);
export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);
export const profileForSchema = z.enum(['SELF', 'SON', 'DAUGHTER', 'BROTHER', 'SISTER', 'RELATIVE']);
export const maritalStatusSchema = z.enum(['NEVER_MARRIED', 'DIVORCED', 'WIDOWED', 'SEPARATED']);

const optionalText = z.string().trim().min(1).max(500).optional().nullable();
const optionalLongText = z.string().trim().min(1).max(3000).optional().nullable();
const optionalEmail = z.string().trim().email().max(320).optional().nullable();
const optionalPhone = z.string().trim().regex(/^\+?[1-9]\d{7,14}$/).optional().nullable();

const dateOfBirthSchema = z.coerce.date().refine((date) => {
  const today = new Date();
  const minimumBirthDate = new Date(
    Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()),
  );

  return date <= minimumBirthDate;
}, {
  message: 'Profile must be at least 18 years old',
});

export const createMatrimonyProfileSchema = z.object({
  profileFor: profileForSchema,
  category: darziCategorySchema,
  gender: genderSchema,
  firstName: z.string().trim().min(1).max(100),
  middleName: z.string().trim().max(100).optional().nullable(),
  lastName: z.string().trim().min(1).max(100),
  dateOfBirth: dateOfBirthSchema,
  heightCm: z.coerce.number().int().min(100).max(250).optional().nullable(),
  maritalStatus: maritalStatusSchema.default('NEVER_MARRIED'),
  contactPhone: optionalPhone,
  contactEmail: optionalEmail,
  education: optionalText,
  occupation: optionalText,
  companyOrBusiness: optionalText,
  annualIncome: z.coerce.number().int().nonnegative().optional().nullable(),
  gotra: optionalText,
  manglik: z.boolean().optional().nullable(),
  birthTime: z.string().trim().max(20).optional().nullable(),
  birthPlace: optionalText,
  currentCity: optionalText,
  district: optionalText,
  state: optionalText,
  country: z.string().trim().min(1).max(100).default('India'),
  fullAddress: optionalLongText,
  nativePlace: optionalText,
  fatherName: optionalText,
  fatherOccupation: optionalText,
  motherName: optionalText,
  motherOccupation: optionalText,
  brothers: z.coerce.number().int().min(0).max(20).default(0),
  sisters: z.coerce.number().int().min(0).max(20).default(0),
  familyDetails: optionalLongText,
  about: optionalLongText,
});

export const updateMatrimonyProfileSchema = createMatrimonyProfileSchema.partial().omit({
  profileFor: true,
});

export const matrimonyListQuerySchema = z.object({
  category: darziCategorySchema.optional(),
  gender: genderSchema.optional(),
  maritalStatus: maritalStatusSchema.optional(),
  state: z.string().trim().min(1).max(100).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  minAge: z.coerce.number().int().min(18).max(100).optional(),
  maxAge: z.coerce.number().int().min(18).max(100).optional(),
  featured: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).refine(
  (data) => data.minAge === undefined || data.maxAge === undefined || data.minAge <= data.maxAge,
  { message: 'minAge must be less than or equal to maxAge', path: ['minAge'] },
);
