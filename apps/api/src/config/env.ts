import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGINS: z.string().default(''),
  ALLOW_VERCEL_PREVIEWS: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  VERCEL_PROJECT_NAME: z.string().optional().default(''),
  GITHUB_TOKEN: z.string().optional(),
  REPO_CACHE_TTL_MS: z.coerce.number().int().positive().default(300_000),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};
