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
  OTP_PROVIDER: z.enum(['disabled']).default('disabled'),
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

export const env = parsed.data;
export const corsOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
