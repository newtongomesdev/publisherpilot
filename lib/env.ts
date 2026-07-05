import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  TURSO_AUTH_TOKEN: z.string().optional(),
  AUTH_SECRET: z.string().default("publisherpilot-local-dev-secret"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
  OPENROUTER_APP_NAME: z.string().default("PublisherPilot"),
  OPENROUTER_SITE_URL: z.string().default("http://localhost:4578"),
  SEARXNG_URL: z.string().optional(),
  SEARXNG_API_KEY: z.string().optional(),
  WORDPRESS_URL: z.string().optional(),
  WORDPRESS_USER: z.string().optional(),
  WORDPRESS_APP_PASSWORD: z.string().optional(),
});

// Lazy validation: only parses at runtime, not during build
let _env: z.infer<typeof envSchema> | null = null;

function getEnv() {
  if (!_env) {
    _env = envSchema.parse(process.env);
  }
  return _env;
}

// Proxy that lazily resolves env vars on first access
export const env = new Proxy({} as z.infer<typeof envSchema>, {
  get(_, prop) {
    return (getEnv() as Record<string, unknown>)[prop as string];
  },
});
