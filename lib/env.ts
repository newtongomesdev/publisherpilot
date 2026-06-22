import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().default("https://api.openai.com/v1"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().default("https://openrouter.ai/api/v1"),
  OPENROUTER_APP_NAME: z.string().default("ArticleForge Studio"),
  OPENROUTER_SITE_URL: z.string().default("http://localhost:3000"),
  SEARXNG_URL: z.string().optional(),
  SEARXNG_API_KEY: z.string().optional(),
  WORDPRESS_URL: z.string().optional(),
  WORDPRESS_USER: z.string().optional(),
  WORDPRESS_APP_PASSWORD: z.string().optional(),
});

export const env = envSchema.parse(process.env);
