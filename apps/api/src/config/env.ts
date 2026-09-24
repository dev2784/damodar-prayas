import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootEnvPath = resolve(currentDir, '../../../../.env');

config({ path: rootEnvPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  CORS_ORIGIN: z.string().default('http://localhost:3000,http://localhost:8081'),
  GOOGLE_WEB_CLIENT_ID: z.string().optional().default(''),
  OTP_PROVIDER: z.enum(['disabled', 'msg91']).default('disabled'),
  MSG91_AUTH_KEY: z.string().optional().default(''),

  MSG91_WIDGET_ID: z.string().optional().default(''),
  MSG91_COUNTRY_CODE: z.string().regex(/^\d{1,3}$/).default('91'),
  OTP_LENGTH: z.coerce.number().int().min(4).max(6).default(4),
  OTP_EXPIRY_MINUTES: z.coerce.number().int().positive().default(5),
  OTP_RESEND_SECONDS: z.coerce.number().int().positive().default(30),
  MEDIA_PROVIDER: z.enum(['disabled', 'local', 'cloudinary']).default('disabled'),
  CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
  CLOUDINARY_API_KEY: z.string().optional().default(''),
  CLOUDINARY_API_SECRET: z.string().optional().default(''),
  ADMIN_SETUP_SECRET: z.string().min(16).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

if (
  parsed.data.MEDIA_PROVIDER === 'cloudinary' &&
  (!parsed.data.CLOUDINARY_CLOUD_NAME || !parsed.data.CLOUDINARY_API_KEY || !parsed.data.CLOUDINARY_API_SECRET)
) {
  console.error('Invalid environment configuration: Cloudinary credentials are required when MEDIA_PROVIDER=cloudinary');
  process.exit(1);
}

if (parsed.data.OTP_PROVIDER === 'msg91' && (!parsed.data.MSG91_AUTH_KEY || !parsed.data.MSG91_WIDGET_ID)) {
  console.error('Invalid environment configuration: MSG91_AUTH_KEY and MSG91_WIDGET_ID are required when OTP_PROVIDER=msg91');
  process.exit(1);
}

export const env = parsed.data;
const productionCorsOrigins = ['https://damodar-prayas-admin.vercel.app'];

export const corsOrigins = [...new Set([
  ...env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean),
  ...productionCorsOrigins,
])];
