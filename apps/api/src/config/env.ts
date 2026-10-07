import 'dotenv/config';
import { z } from 'zod';

// docker compose passes unset variables through as "", so treat blank as absent.
const blankToUndefined = (v: unknown) => (v === '' ? undefined : v);
const optionalString = z.preprocess(blankToUndefined, z.string().optional());

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
  SMTP_HOST: optionalString,
  SMTP_PORT: z.preprocess(blankToUndefined, z.coerce.number().int().positive().default(587)),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  MAIL_FROM: z.preprocess(blankToUndefined, z.string().email().optional()),
  ADMIN_EMAIL: z.preprocess(blankToUndefined, z.string().email().optional()),
  APP_URL: z.preprocess(blankToUndefined, z.string().url().optional()),
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
