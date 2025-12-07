import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string(),
  RESEND_API_KEY: z.string().optional(),
  APP_URL: z.string().default('http://localhost:3000'),
});

export const env = envSchema.parse(process.env);
