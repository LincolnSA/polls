import { z } from "zod";

const schema = z.object({
  APP_PORT: z.string().transform(port => Number(port)),
  APP_HOST: z.string().ip(),
  COOKIE_SECRET: z.string(),
  DATABASE_URL: z.string().url(),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(port => Number(port)),
  ALLOW_EMPTY_PASSWORD: z.string(),
});

export const env = schema.parse(process.env);
