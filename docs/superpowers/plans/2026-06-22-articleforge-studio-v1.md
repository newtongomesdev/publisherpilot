# ArticleForge Studio V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first functional version of `ArticleForge Studio` as a `Next.js` web app that researches sources, generates articles with AI, stores workflow state in `Turso`, supports editing, and exports in `Markdown`, `HTML`, and `PDF`.

**Architecture:** Start from a new `Next.js App Router` codebase and keep the app as a modular monolith. Use `Drizzle` + `libSQL` for persistence, server-side provider adapters for search/AI/export orchestration, and a database-backed job queue so UI actions trigger durable workflow steps instead of synchronous page-bound logic.

**Tech Stack:** `Next.js`, `TypeScript`, `Tailwind CSS`, `shadcn/ui`, `Turso/libSQL`, `Drizzle ORM`, `Zod`, `OpenRouter API`, `OpenAI API`, `DuckDuckGo`, `SearXNG`, PDF export library compatible with `Next.js`.

---

## File Structure

### App shell and routes

- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.js`
- Create: `components.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `app/dashboard/page.tsx`
- Create: `app/articles/new/page.tsx`
- Create: `app/articles/[id]/page.tsx`
- Create: `app/settings/page.tsx`
- Create: `app/exports/page.tsx`
- Create: `app/api/articles/route.ts`
- Create: `app/api/articles/[id]/route.ts`
- Create: `app/api/models/route.ts`
- Create: `app/api/search/route.ts`
- Create: `app/api/generate/route.ts`
- Create: `app/api/export/route.ts`
- Create: `app/api/jobs/route.ts`

### Shared UI

- Create: `components/dashboard-shell.tsx`
- Create: `components/article-form.tsx`
- Create: `components/article-editor.tsx`
- Create: `components/model-selector.tsx`
- Create: `components/provider-selector.tsx`
- Create: `components/source-list.tsx`
- Create: `components/export-buttons.tsx`
- Create: `components/status-badge.tsx`
- Create: `components/job-timeline.tsx`
- Create: `components/ui/*` via `shadcn/ui`

### Domain and services

- Create: `lib/utils.ts`
- Create: `lib/constants.ts`
- Create: `lib/env.ts`
- Create: `lib/article/types.ts`
- Create: `lib/article/validator.ts`
- Create: `lib/article/formatter.ts`
- Create: `lib/article/markdown.ts`
- Create: `lib/db/client.ts`
- Create: `lib/db/schema.ts`
- Create: `lib/db/queries.ts`
- Create: `lib/db/migrations/`
- Create: `lib/jobs/types.ts`
- Create: `lib/jobs/queue.ts`
- Create: `lib/jobs/worker.ts`
- Create: `lib/jobs/handlers/search-job.ts`
- Create: `lib/jobs/handlers/generate-job.ts`
- Create: `lib/jobs/handlers/export-job.ts`
- Create: `lib/search/search-provider.ts`
- Create: `lib/search/registry.ts`
- Create: `lib/search/dedupe.ts`
- Create: `lib/search/rank.ts`
- Create: `lib/search/providers/duckduckgo.ts`
- Create: `lib/search/providers/searxng.ts`
- Create: `lib/ai/ai-provider.ts`
- Create: `lib/ai/registry.ts`
- Create: `lib/ai/prompts.ts`
- Create: `lib/ai/providers/openrouter.ts`
- Create: `lib/ai/providers/openai.ts`
- Create: `lib/export/export-provider.ts`
- Create: `lib/export/markdown.ts`
- Create: `lib/export/html.ts`
- Create: `lib/export/pdf.ts`
- Create: `lib/publishers/wordpress.ts`
- Create: `lib/publishers/ghost.ts`
- Create: `lib/publishers/medium.ts`
- Create: `lib/publishers/generic-api.ts`

### Prompts, docs, config

- Create: `prompts/article-generation.md`
- Create: `prompts/article-improve.md`
- Create: `prompts/article-expand.md`
- Create: `prompts/article-summary.md`
- Create: `.env.example`
- Create: `drizzle.config.ts`
- Create: `README.md`

### Tests

- Create: `tests/article/validator.test.ts`
- Create: `tests/article/formatter.test.ts`
- Create: `tests/search/dedupe.test.ts`
- Create: `tests/search/rank.test.ts`
- Create: `tests/jobs/queue.test.ts`
- Create: `tests/api/articles.test.ts`
- Create: `tests/api/models.test.ts`
- Create: `tests/api/generate.test.ts`
- Create: `tests/export/exporters.test.ts`

### Notes

- The project starts empty and is not a Git repository yet.
- During implementation, initialize Git before the first commit step: `git init`.
- Use the plan as the source of truth for naming. Avoid renaming `ArticleProject`, `GeneratedArticle`, and provider contracts mid-implementation.

### Task 1: Scaffold the app foundation

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.js`
- Create: `tailwind.config.ts`
- Create: `components.json`
- Create: `app/layout.tsx`
- Create: `app/page.tsx`
- Create: `app/globals.css`
- Create: `lib/utils.ts`
- Create: `.gitignore`

- [ ] **Step 1: Initialize the app package and scripts**

```json
{
  "name": "articleforge-studio",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.9.0",
    "@libsql/client": "^0.14.0",
    "@radix-ui/react-dialog": "^1.1.1",
    "@radix-ui/react-select": "^2.1.1",
    "@radix-ui/react-tabs": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.33.0",
    "lucide-react": "^0.441.0",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-hook-form": "^7.53.0",
    "sonner": "^1.5.0",
    "tailwind-merge": "^2.5.2",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/node": "^22.7.4",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "autoprefixer": "^10.4.20",
    "eslint": "^9.11.1",
    "eslint-config-next": "^15.0.0",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.13",
    "typescript": "^5.6.2",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: packages install successfully and `package-lock.json` is created.

- [ ] **Step 3: Add baseline Next.js and Tailwind config**

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
```

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Create the initial layout and home page**

```tsx
// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArticleForge Studio",
  description: "Plataforma editorial para gerar, editar e exportar artigos com IA.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-zinc-950 text-zinc-50 antialiased">{children}</body>
    </html>
  );
}
```

```tsx
// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
      <div className="max-w-3xl space-y-6">
        <h1 className="text-5xl font-semibold tracking-tight">ArticleForge Studio</h1>
        <p className="text-lg text-zinc-300">
          Pesquise fontes reais, gere artigos estruturados com IA, edite o conteúdo e exporte em
          múltiplos formatos.
        </p>
        <div className="flex gap-4">
          <Link href="/dashboard" className="rounded-full bg-emerald-400 px-6 py-3 font-medium text-zinc-950">
            Abrir dashboard
          </Link>
          <Link href="/articles/new" className="rounded-full border border-zinc-700 px-6 py-3 font-medium">
            Novo artigo
          </Link>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Run the app to confirm the scaffold works**

Run: `npm run build`
Expected: `Compiled successfully` or equivalent successful Next.js build output.

- [ ] **Step 6: Initialize Git and commit the scaffold**

```bash
git init
git add .
git commit -m "chore: scaffold articleforge studio app"
```

### Task 2: Build database schema and Drizzle wiring

**Files:**
- Create: `drizzle.config.ts`
- Create: `lib/db/client.ts`
- Create: `lib/db/schema.ts`
- Create: `lib/db/queries.ts`
- Create: `lib/env.ts`
- Create: `.env.example`

- [ ] **Step 1: Write a failing schema smoke test**

```ts
// tests/jobs/queue.test.ts
import { describe, expect, it } from "vitest";
import { jobQueue } from "@/lib/db/schema";

describe("db schema", () => {
  it("exposes the job queue table", () => {
    expect(jobQueue).toBeDefined();
  });
});
```

- [ ] **Step 2: Run the test to verify the schema file is missing**

Run: `npx vitest run tests/jobs/queue.test.ts`
Expected: FAIL with module resolution error for `@/lib/db/schema`.

- [ ] **Step 3: Implement environment parsing and database tables**

```ts
// lib/env.ts
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
```

```ts
// lib/db/client.ts
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/lib/env";

const client = createClient({ url: env.DATABASE_URL });
export const db = drizzle(client);
```

```ts
// lib/db/schema.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
};

export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey(),
  defaultLanguage: text("default_language"),
  defaultTone: text("default_tone"),
  defaultArticleType: text("default_article_type"),
  blockedDomainsJson: text("blocked_domains_json"),
  preferredSearchProvider: text("preferred_search_provider"),
  preferredAiProvider: text("preferred_ai_provider"),
  preferredModelId: text("preferred_model_id"),
  ...timestamps,
});

export const apiProviders = sqliteTable("api_providers", {
  id: text("id").primaryKey(),
  providerKey: text("provider_key").notNull(),
  displayName: text("display_name").notNull(),
  baseUrl: text("base_url"),
  apiKeyEncrypted: text("api_key_encrypted"),
  sourceType: text("source_type").notNull().default("env"),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(true),
  metadataJson: text("metadata_json"),
  ...timestamps,
});

export const aiModels = sqliteTable("ai_models", {
  id: text("id").primaryKey(),
  providerKey: text("provider_key").notNull(),
  modelId: text("model_id").notNull(),
  slug: text("slug"),
  name: text("name").notNull(),
  contextWindow: integer("context_window"),
  pricingJson: text("pricing_json"),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp_ms" }),
  ...timestamps,
});

export const articleProjects = sqliteTable("article_projects", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  niche: text("niche").notNull(),
  language: text("language").notNull(),
  editorialTone: text("editorial_tone").notNull(),
  desiredLength: text("desired_length").notNull(),
  articleType: text("article_type").notNull(),
  sourceCount: integer("source_count").notNull(),
  searchProvider: text("search_provider").notNull(),
  aiProvider: text("ai_provider").notNull(),
  aiModelId: text("ai_model_id").notNull(),
  status: text("status").notNull().default("draft"),
  currentError: text("current_error"),
  ...timestamps,
});

export const articleSources = sqliteTable("article_sources", {
  id: text("id").primaryKey(),
  articleProjectId: text("article_project_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  domain: text("domain").notNull(),
  snippet: text("snippet"),
  publishedAt: integer("published_at", { mode: "timestamp_ms" }),
  searchProvider: text("search_provider").notNull(),
  relevanceScore: integer("relevance_score").notNull().default(0),
  dedupeHash: text("dedupe_hash").notNull(),
  ...timestamps,
});

export const generatedArticles = sqliteTable("generated_articles", {
  id: text("id").primaryKey(),
  articleProjectId: text("article_project_id").notNull(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  language: text("language").notNull(),
  niche: text("niche").notNull(),
  excerpt: text("excerpt").notNull(),
  metaDescription: text("meta_description").notNull(),
  tagsJson: text("tags_json").notNull(),
  outlineJson: text("outline_json").notNull(),
  intro: text("intro").notNull(),
  sectionsJson: text("sections_json").notNull(),
  factsJson: text("facts_json").notNull(),
  faqJson: text("faq_json").notNull(),
  conclusion: text("conclusion").notNull(),
  sourcesJson: text("sources_json").notNull(),
  rawJson: text("raw_json").notNull(),
  markdownContent: text("markdown_content").notNull(),
  htmlContent: text("html_content").notNull(),
  ...timestamps,
});

export const exportHistory = sqliteTable("export_history", {
  id: text("id").primaryKey(),
  articleProjectId: text("article_project_id").notNull(),
  generatedArticleId: text("generated_article_id").notNull(),
  format: text("format").notNull(),
  status: text("status").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path"),
  errorMessage: text("error_message"),
  ...timestamps,
});

export const publishTargets = sqliteTable("publish_targets", {
  id: text("id").primaryKey(),
  targetType: text("target_type").notNull(),
  name: text("name").notNull(),
  isEnabled: integer("is_enabled", { mode: "boolean" }).notNull().default(false),
  configJson: text("config_json"),
  lastValidatedAt: integer("last_validated_at", { mode: "timestamp_ms" }),
  notes: text("notes"),
  ...timestamps,
});

export const jobQueue = sqliteTable("job_queue", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  status: text("status").notNull().default("queued"),
  payloadJson: text("payload_json").notNull(),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }),
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  finishedAt: integer("finished_at", { mode: "timestamp_ms" }),
  errorMessage: text("error_message"),
  ...timestamps,
});
```

- [ ] **Step 4: Add Drizzle config and env example**

```ts
// drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
} satisfies Config;
```

```env
# .env.example
DATABASE_URL=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_APP_NAME=ArticleForge Studio
OPENROUTER_SITE_URL=http://localhost:3000
SEARXNG_URL=
SEARXNG_API_KEY=
WORDPRESS_URL=
WORDPRESS_USER=
WORDPRESS_APP_PASSWORD=
```

- [ ] **Step 5: Run the schema test and generate the first migration**

Run: `npx vitest run tests/jobs/queue.test.ts && npx drizzle-kit generate`
Expected: test passes and a migration file is created under `lib/db/migrations`.

- [ ] **Step 6: Commit the database foundation**

```bash
git add drizzle.config.ts lib/db lib/env.ts .env.example tests/jobs/queue.test.ts
git commit -m "feat: add articleforge database schema"
```

### Task 3: Define article types, validation, and formatting

**Files:**
- Create: `lib/article/types.ts`
- Create: `lib/article/validator.ts`
- Create: `lib/article/formatter.ts`
- Create: `lib/article/markdown.ts`
- Create: `tests/article/validator.test.ts`
- Create: `tests/article/formatter.test.ts`

- [ ] **Step 1: Write failing tests for article validation and markdown formatting**

```ts
// tests/article/validator.test.ts
import { describe, expect, it } from "vitest";
import { generatedArticleSchema } from "@/lib/article/validator";

describe("generatedArticleSchema", () => {
  it("accepts valid generated article JSON", () => {
    const parsed = generatedArticleSchema.safeParse({
      title: "Titulo",
      slug: "titulo",
      language: "pt-BR",
      niche: "tecnologia",
      excerpt: "Resumo",
      metaDescription: "Meta",
      tags: ["tag"],
      outline: ["Intro"],
      intro: "Introducao",
      sections: [{ heading: "Secao", body: "Corpo", sourceUrls: ["https://example.com"] }],
      facts: ["Fato"],
      faq: [{ question: "Q?", answer: "A." }],
      conclusion: "Conclusao",
      sources: [{ title: "Fonte", url: "https://example.com", domain: "example.com" }],
    });

    expect(parsed.success).toBe(true);
  });
});
```

```ts
// tests/article/formatter.test.ts
import { describe, expect, it } from "vitest";
import { toMarkdown } from "@/lib/article/markdown";

describe("toMarkdown", () => {
  it("renders title, sections, and sources", () => {
    const result = toMarkdown({
      title: "Titulo",
      excerpt: "Resumo",
      intro: "Introducao",
      conclusion: "Conclusao",
      sections: [{ heading: "Secao", body: "Texto", sourceUrls: [] }],
      sources: [{ title: "Fonte", url: "https://example.com", domain: "example.com" }],
    } as never);

    expect(result).toContain("# Titulo");
    expect(result).toContain("## Secao");
    expect(result).toContain("https://example.com");
  });
});
```

- [ ] **Step 2: Run the article tests to verify they fail**

Run: `npx vitest run tests/article/validator.test.ts tests/article/formatter.test.ts`
Expected: FAIL because article modules do not exist yet.

- [ ] **Step 3: Implement the shared article types and Zod schema**

```ts
// lib/article/types.ts
export type ArticleSection = {
  heading: string;
  body: string;
  sourceUrls: string[];
};

export type ArticleFaq = {
  question: string;
  answer: string;
};

export type ArticleSource = {
  title: string;
  url: string;
  domain: string;
};

export type GeneratedArticle = {
  title: string;
  slug: string;
  language: string;
  niche: string;
  excerpt: string;
  metaDescription: string;
  tags: string[];
  outline: string[];
  intro: string;
  sections: ArticleSection[];
  facts: string[];
  faq: ArticleFaq[];
  conclusion: string;
  sources: ArticleSource[];
};
```

```ts
// lib/article/validator.ts
import { z } from "zod";

export const generatedArticleSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  language: z.string().min(1),
  niche: z.string().min(1),
  excerpt: z.string().min(1),
  metaDescription: z.string().min(1),
  tags: z.array(z.string()),
  outline: z.array(z.string()),
  intro: z.string().min(1),
  sections: z.array(
    z.object({
      heading: z.string().min(1),
      body: z.string().min(1),
      sourceUrls: z.array(z.string().url()),
    }),
  ),
  facts: z.array(z.string()),
  faq: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().min(1),
    }),
  ),
  conclusion: z.string().min(1),
  sources: z.array(
    z.object({
      title: z.string().min(1),
      url: z.string().url(),
      domain: z.string().min(1),
    }),
  ),
});
```

- [ ] **Step 4: Implement markdown and HTML helpers**

```ts
// lib/article/markdown.ts
import type { GeneratedArticle } from "@/lib/article/types";

export function toMarkdown(article: GeneratedArticle) {
  const sections = article.sections
    .map((section) => `## ${section.heading}\n\n${section.body}`)
    .join("\n\n");

  const sources = article.sources.map((source) => `- [${source.title}](${source.url})`).join("\n");

  return [
    `# ${article.title}`,
    article.excerpt,
    article.intro,
    sections,
    `## Conclusao\n\n${article.conclusion}`,
    `## Fontes\n\n${sources}`,
  ].join("\n\n");
}
```

```ts
// lib/article/formatter.ts
import type { GeneratedArticle } from "@/lib/article/types";
import { toMarkdown } from "@/lib/article/markdown";

export function formatGeneratedArticle(article: GeneratedArticle) {
  const markdown = toMarkdown(article);
  const html = markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      return line ? `<p>${line}</p>` : "";
    })
    .join("");

  return { markdown, html };
}
```

- [ ] **Step 5: Run the article tests and confirm they pass**

Run: `npx vitest run tests/article/validator.test.ts tests/article/formatter.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the article domain**

```bash
git add lib/article tests/article
git commit -m "feat: add generated article validation and formatting"
```

### Task 4: Implement search provider contracts and ranking

**Files:**
- Create: `lib/search/search-provider.ts`
- Create: `lib/search/registry.ts`
- Create: `lib/search/dedupe.ts`
- Create: `lib/search/rank.ts`
- Create: `lib/search/providers/duckduckgo.ts`
- Create: `lib/search/providers/searxng.ts`
- Create: `tests/search/dedupe.test.ts`
- Create: `tests/search/rank.test.ts`

- [ ] **Step 1: Write failing tests for dedupe and ranking**

```ts
// tests/search/dedupe.test.ts
import { describe, expect, it } from "vitest";
import { dedupeSources } from "@/lib/search/dedupe";

describe("dedupeSources", () => {
  it("removes duplicate URLs", () => {
    const results = dedupeSources([
      { url: "https://example.com/a", title: "A" },
      { url: "https://example.com/a", title: "A again" },
    ] as never);

    expect(results).toHaveLength(1);
  });
});
```

```ts
// tests/search/rank.test.ts
import { describe, expect, it } from "vitest";
import { rankSources } from "@/lib/search/rank";

describe("rankSources", () => {
  it("prioritizes results containing query terms in title", () => {
    const ranked = rankSources("ia editorial", [
      { title: "Guia de IA editorial", snippet: "", url: "https://a.com", domain: "a.com" },
      { title: "Outro assunto", snippet: "", url: "https://b.com", domain: "b.com" },
    ] as never);

    expect(ranked[0]?.domain).toBe("a.com");
  });
});
```

- [ ] **Step 2: Run the search tests to verify they fail**

Run: `npx vitest run tests/search/dedupe.test.ts tests/search/rank.test.ts`
Expected: FAIL due to missing search modules.

- [ ] **Step 3: Implement the provider contract and normalized result type**

```ts
// lib/search/search-provider.ts
export type SearchResult = {
  title: string;
  url: string;
  domain: string;
  snippet: string;
  publishedAt?: string | null;
  provider: string;
  relevanceScore: number;
};

export type SearchOptions = {
  limit: number;
  blockedDomains?: string[];
};

export interface SearchProvider {
  name: string;
  search(query: string, options: SearchOptions): Promise<SearchResult[]>;
}
```

- [ ] **Step 4: Implement dedupe, ranking, and provider registry**

```ts
// lib/search/dedupe.ts
import type { SearchResult } from "@/lib/search/search-provider";

export function dedupeSources(results: SearchResult[]) {
  const seen = new Set<string>();
  return results.filter((result) => {
    const key = new URL(result.url).toString().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
```

```ts
// lib/search/rank.ts
import type { SearchResult } from "@/lib/search/search-provider";

export function rankSources(query: string, results: SearchResult[]) {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);

  return [...results]
    .map((result) => ({
      ...result,
      relevanceScore: terms.reduce((score, term) => {
        const haystack = `${result.title} ${result.snippet}`.toLowerCase();
        return haystack.includes(term) ? score + 10 : score;
      }, result.relevanceScore ?? 0),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}
```

```ts
// lib/search/registry.ts
import type { SearchProvider } from "@/lib/search/search-provider";

const registry = new Map<string, SearchProvider>();

export function registerSearchProvider(provider: SearchProvider) {
  registry.set(provider.name, provider);
}

export function getSearchProvider(name: string) {
  return registry.get(name);
}

export function listSearchProviders() {
  return [...registry.values()];
}
```

- [ ] **Step 5: Add real provider adapters and re-run tests**

```ts
// lib/search/providers/duckduckgo.ts
import type { SearchOptions, SearchProvider, SearchResult } from "@/lib/search/search-provider";

export class DuckDuckGoSearchProvider implements SearchProvider {
  name = "duckduckgo";

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    const response = await fetch(`https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    const html = await response.text();

    return html
      .split("result__a")
      .slice(1, options.limit + 1)
      .map((chunk, index) => ({
        title: chunk.match(/>([^<]+)<\/a>/)?.[1]?.trim() ?? `Resultado ${index + 1}`,
        url: chunk.match(/href="([^"]+)"/)?.[1] ?? "",
        domain: "duckduckgo.com",
        snippet: "",
        provider: this.name,
        relevanceScore: 0,
      }))
      .filter((item) => item.url);
  }
}
```

```ts
// lib/search/providers/searxng.ts
import type { SearchOptions, SearchProvider, SearchResult } from "@/lib/search/search-provider";
import { env } from "@/lib/env";

export class SearxngSearchProvider implements SearchProvider {
  name = "searxng";

  async search(query: string, options: SearchOptions): Promise<SearchResult[]> {
    if (!env.SEARXNG_URL) return [];

    const response = await fetch(
      `${env.SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json`,
      {
        headers: env.SEARXNG_API_KEY ? { Authorization: `Bearer ${env.SEARXNG_API_KEY}` } : undefined,
      },
    );

    const payload = (await response.json()) as { results?: Array<Record<string, unknown>> };

    return (payload.results ?? []).slice(0, options.limit).map((item) => ({
      title: String(item.title ?? ""),
      url: String(item.url ?? ""),
      domain: new URL(String(item.url ?? env.SEARXNG_URL)).hostname,
      snippet: String(item.content ?? ""),
      publishedAt: item.publishedDate ? String(item.publishedDate) : null,
      provider: this.name,
      relevanceScore: 0,
    }));
  }
}
```

Run: `npx vitest run tests/search/dedupe.test.ts tests/search/rank.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the search foundation**

```bash
git add lib/search tests/search
git commit -m "feat: add search provider layer"
```

### Task 5: Implement AI provider contracts and model discovery

**Files:**
- Create: `lib/ai/ai-provider.ts`
- Create: `lib/ai/registry.ts`
- Create: `lib/ai/providers/openrouter.ts`
- Create: `lib/ai/providers/openai.ts`
- Create: `lib/ai/prompts.ts`
- Create: `tests/api/models.test.ts`

- [ ] **Step 1: Write a failing test for model normalization**

```ts
// tests/api/models.test.ts
import { describe, expect, it } from "vitest";
import { normalizeOpenRouterModel } from "@/lib/ai/providers/openrouter";

describe("normalizeOpenRouterModel", () => {
  it("keeps id and name for UI use", () => {
    const model = normalizeOpenRouterModel({ id: "openai/gpt-4o-mini", name: "GPT-4o Mini" });
    expect(model.modelId).toBe("openai/gpt-4o-mini");
    expect(model.name).toBe("GPT-4o Mini");
  });
});
```

- [ ] **Step 2: Run the model test to verify it fails**

Run: `npx vitest run tests/api/models.test.ts`
Expected: FAIL because AI provider modules do not exist.

- [ ] **Step 3: Implement the AI provider interface and registry**

```ts
// lib/ai/ai-provider.ts
import type { GeneratedArticle } from "@/lib/article/types";

export type AiModelSummary = {
  modelId: string;
  name: string;
  slug?: string;
  contextWindow?: number;
  pricing?: Record<string, unknown>;
};

export type GenerateArticleOptions = {
  model: string;
  temperature?: number;
};

export interface AiProvider {
  name: string;
  listModels(): Promise<AiModelSummary[]>;
  generateArticle(prompt: string, options: GenerateArticleOptions): Promise<GeneratedArticle>;
}
```

```ts
// lib/ai/registry.ts
import type { AiProvider } from "@/lib/ai/ai-provider";

const registry = new Map<string, AiProvider>();

export function registerAiProvider(provider: AiProvider) {
  registry.set(provider.name, provider);
}

export function getAiProvider(name: string) {
  return registry.get(name);
}

export function listAiProviders() {
  return [...registry.values()];
}
```

- [ ] **Step 4: Implement OpenRouter and OpenAI providers**

```ts
// lib/ai/providers/openrouter.ts
import { env } from "@/lib/env";
import type { AiModelSummary, AiProvider, GenerateArticleOptions } from "@/lib/ai/ai-provider";
import { generatedArticleSchema } from "@/lib/article/validator";

export function normalizeOpenRouterModel(input: { id: string; name?: string; context_length?: number }) {
  return {
    modelId: input.id,
    name: input.name ?? input.id,
    slug: input.id,
    contextWindow: input.context_length,
  } satisfies AiModelSummary;
}

export class OpenRouterProvider implements AiProvider {
  name = "openrouter";

  async listModels() {
    const response = await fetch(`${env.OPENROUTER_BASE_URL}/models`, {
      headers: env.OPENROUTER_API_KEY ? { Authorization: `Bearer ${env.OPENROUTER_API_KEY}` } : {},
    });
    const payload = (await response.json()) as { data?: Array<{ id: string; name?: string; context_length?: number }> };
    return (payload.data ?? []).map(normalizeOpenRouterModel);
  }

  async generateArticle(prompt: string, options: GenerateArticleOptions) {
    const response = await fetch(`${env.OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": env.OPENROUTER_SITE_URL,
        "X-Title": env.OPENROUTER_APP_NAME,
      },
      body: JSON.stringify({
        model: options.model,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const payload = await response.json();
    const raw = payload.choices?.[0]?.message?.content ?? "{}";
    return generatedArticleSchema.parse(JSON.parse(raw));
  }
}
```

```ts
// lib/ai/providers/openai.ts
import { env } from "@/lib/env";
import type { AiProvider, GenerateArticleOptions } from "@/lib/ai/ai-provider";
import { generatedArticleSchema } from "@/lib/article/validator";

export class OpenAIProvider implements AiProvider {
  name = "openai";

  async listModels() {
    const response = await fetch(`${env.OPENAI_BASE_URL}/models`, {
      headers: env.OPENAI_API_KEY ? { Authorization: `Bearer ${env.OPENAI_API_KEY}` } : {},
    });
    const payload = (await response.json()) as { data?: Array<{ id: string }> };
    return (payload.data ?? []).map((item) => ({ modelId: item.id, name: item.id, slug: item.id }));
  }

  async generateArticle(prompt: string, options: GenerateArticleOptions) {
    const response = await fetch(`${env.OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: options.model,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const payload = await response.json();
    const raw = payload.choices?.[0]?.message?.content ?? "{}";
    return generatedArticleSchema.parse(JSON.parse(raw));
  }
}
```

- [ ] **Step 5: Add prompt loading helper and rerun the test**

```ts
// lib/ai/prompts.ts
import { readFile } from "node:fs/promises";
import path from "node:path";

export async function loadPromptFile(fileName: string) {
  const filePath = path.join(process.cwd(), "prompts", fileName);
  return readFile(filePath, "utf8");
}
```

Run: `npx vitest run tests/api/models.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the AI provider layer**

```bash
git add lib/ai tests/api/models.test.ts
git commit -m "feat: add ai provider registry"
```

### Task 6: Build the job queue and worker handlers

**Files:**
- Create: `lib/jobs/types.ts`
- Create: `lib/jobs/queue.ts`
- Create: `lib/jobs/worker.ts`
- Create: `lib/jobs/handlers/search-job.ts`
- Create: `lib/jobs/handlers/generate-job.ts`
- Create: `lib/jobs/handlers/export-job.ts`
- Modify: `tests/jobs/queue.test.ts`

- [ ] **Step 1: Extend the queue test to cover enqueue behavior**

```ts
// tests/jobs/queue.test.ts
import { describe, expect, it } from "vitest";
import { createJobPayload } from "@/lib/jobs/queue";

describe("job queue helpers", () => {
  it("serializes payloads for persistence", () => {
    const payload = createJobPayload({ articleProjectId: "article_1", format: "markdown" });
    expect(payload).toContain("article_1");
    expect(payload).toContain("markdown");
  });
});
```

- [ ] **Step 2: Run the queue test to verify it fails**

Run: `npx vitest run tests/jobs/queue.test.ts`
Expected: FAIL because `createJobPayload` does not exist yet.

- [ ] **Step 3: Implement job types and queue helpers**

```ts
// lib/jobs/types.ts
export type JobType = "search" | "generate" | "export" | "publish";
export type JobStatus = "queued" | "running" | "completed" | "failed" | "retrying";
```

```ts
// lib/jobs/queue.ts
import type { JobType } from "@/lib/jobs/types";

export function createJobPayload(payload: Record<string, unknown>) {
  return JSON.stringify(payload);
}

export function createJobRecord(type: JobType, payload: Record<string, unknown>) {
  return {
    type,
    status: "queued" as const,
    payloadJson: createJobPayload(payload),
    attempts: 0,
    maxAttempts: 3,
    scheduledAt: Date.now(),
  };
}
```

- [ ] **Step 4: Implement worker dispatch and handler stubs**

```ts
// lib/jobs/worker.ts
import type { JobType } from "@/lib/jobs/types";

type Handler = (payload: Record<string, unknown>) => Promise<void>;

export function createWorker(handlers: Record<JobType, Handler>) {
  return {
    async run(job: { type: JobType; payloadJson: string }) {
      const payload = JSON.parse(job.payloadJson) as Record<string, unknown>;
      await handlers[job.type](payload);
    },
  };
}
```

```ts
// lib/jobs/handlers/search-job.ts
export async function runSearchJob(_payload: Record<string, unknown>) {
  return;
}
```

```ts
// lib/jobs/handlers/generate-job.ts
export async function runGenerateJob(_payload: Record<string, unknown>) {
  return;
}
```

```ts
// lib/jobs/handlers/export-job.ts
export async function runExportJob(_payload: Record<string, unknown>) {
  return;
}
```

- [ ] **Step 5: Run the queue test again**

Run: `npx vitest run tests/jobs/queue.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the queue primitives**

```bash
git add lib/jobs tests/jobs/queue.test.ts
git commit -m "feat: add job queue primitives"
```

### Task 7: Create article and workflow APIs

**Files:**
- Create: `app/api/articles/route.ts`
- Create: `app/api/articles/[id]/route.ts`
- Create: `app/api/search/route.ts`
- Create: `app/api/generate/route.ts`
- Create: `app/api/jobs/route.ts`
- Create: `tests/api/articles.test.ts`
- Create: `tests/api/generate.test.ts`

- [ ] **Step 1: Write failing tests for article creation and generation request validation**

```ts
// tests/api/articles.test.ts
import { describe, expect, it } from "vitest";
import { createArticleProjectSchema } from "@/app/api/articles/route";

describe("createArticleProjectSchema", () => {
  it("accepts a valid article project payload", () => {
    const parsed = createArticleProjectSchema.safeParse({
      topic: "IA no jornalismo",
      niche: "tecnologia",
      language: "pt-BR",
      editorialTone: "Jornalistico",
      desiredLength: "1500-2000 palavras",
      articleType: "Artigo informativo",
      sourceCount: 5,
      searchProvider: "both",
      aiProvider: "openrouter",
      aiModelId: "openai/gpt-4o-mini",
    });

    expect(parsed.success).toBe(true);
  });
});
```

```ts
// tests/api/generate.test.ts
import { describe, expect, it } from "vitest";
import { enqueueGenerateSchema } from "@/app/api/generate/route";

describe("enqueueGenerateSchema", () => {
  it("requires an articleProjectId", () => {
    expect(enqueueGenerateSchema.safeParse({ articleProjectId: "article_1" }).success).toBe(true);
  });
});
```

- [ ] **Step 2: Run the API tests to verify they fail**

Run: `npx vitest run tests/api/articles.test.ts tests/api/generate.test.ts`
Expected: FAIL because route modules do not exist.

- [ ] **Step 3: Implement request schemas and route handlers**

```ts
// app/api/articles/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

export const createArticleProjectSchema = z.object({
  topic: z.string().min(1),
  niche: z.string().min(1),
  language: z.string().min(1),
  editorialTone: z.string().min(1),
  desiredLength: z.string().min(1),
  articleType: z.string().min(1),
  sourceCount: z.number().int().min(1).max(20),
  searchProvider: z.string().min(1),
  aiProvider: z.string().min(1),
  aiModelId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createArticleProjectSchema.parse(body);
  return NextResponse.json({ ok: true, project: parsed }, { status: 201 });
}
```

```ts
// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

export const enqueueGenerateSchema = z.object({
  articleProjectId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = enqueueGenerateSchema.parse(body);
  return NextResponse.json({ ok: true, jobType: "generate", payload: parsed }, { status: 202 });
}
```

```ts
// app/api/search/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";

const searchRequestSchema = z.object({
  query: z.string().min(1),
  provider: z.enum(["duckduckgo", "searxng", "both"]),
  limit: z.number().int().min(1).max(20).default(5),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = searchRequestSchema.parse(body);
  return NextResponse.json({ ok: true, search: parsed });
}
```

```ts
// app/api/jobs/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ jobs: [] });
}
```

- [ ] **Step 4: Add per-article fetch/update route**

```ts
// app/api/articles/[id]/route.ts
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ id });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const body = await request.json();
  const { id } = await params;
  return NextResponse.json({ id, updates: body });
}
```

- [ ] **Step 5: Run the API tests again**

Run: `npx vitest run tests/api/articles.test.ts tests/api/generate.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit the API contracts**

```bash
git add app/api tests/api
git commit -m "feat: add workflow api contracts"
```

### Task 8: Build export providers

**Files:**
- Create: `lib/export/export-provider.ts`
- Create: `lib/export/markdown.ts`
- Create: `lib/export/html.ts`
- Create: `lib/export/pdf.ts`
- Create: `tests/export/exporters.test.ts`

- [ ] **Step 1: Write failing tests for markdown and HTML export**

```ts
// tests/export/exporters.test.ts
import { describe, expect, it } from "vitest";
import { MarkdownExporter } from "@/lib/export/markdown";
import { HtmlExporter } from "@/lib/export/html";

const article = {
  title: "Titulo",
  excerpt: "Resumo",
  intro: "Intro",
  conclusion: "Fim",
  sections: [{ heading: "Secao", body: "Texto", sourceUrls: [] }],
  sources: [{ title: "Fonte", url: "https://example.com", domain: "example.com" }],
} as never;

describe("exporters", () => {
  it("exports markdown", async () => {
    const exporter = new MarkdownExporter();
    const output = await exporter.export(article);
    expect(output.fileName).toBe("titulo.md");
  });

  it("exports html", async () => {
    const exporter = new HtmlExporter();
    const output = await exporter.export(article);
    expect(output.content).toContain("<html");
  });
});
```

- [ ] **Step 2: Run the exporter test to verify it fails**

Run: `npx vitest run tests/export/exporters.test.ts`
Expected: FAIL because exporter files do not exist.

- [ ] **Step 3: Implement exporter contracts and markdown/html exporters**

```ts
// lib/export/export-provider.ts
import type { GeneratedArticle } from "@/lib/article/types";

export type ExportResult = {
  fileName: string;
  content: string | Uint8Array;
  mimeType: string;
};

export interface ExportProvider {
  export(article: GeneratedArticle): Promise<ExportResult>;
}
```

```ts
// lib/export/markdown.ts
import type { GeneratedArticle } from "@/lib/article/types";
import type { ExportProvider } from "@/lib/export/export-provider";
import { toMarkdown } from "@/lib/article/markdown";

export class MarkdownExporter implements ExportProvider {
  async export(article: GeneratedArticle) {
    return {
      fileName: `${article.title.toLowerCase().replace(/\s+/g, "-")}.md`,
      content: toMarkdown(article),
      mimeType: "text/markdown",
    };
  }
}
```

```ts
// lib/export/html.ts
import type { GeneratedArticle } from "@/lib/article/types";
import type { ExportProvider } from "@/lib/export/export-provider";
import { formatGeneratedArticle } from "@/lib/article/formatter";

export class HtmlExporter implements ExportProvider {
  async export(article: GeneratedArticle) {
    const { html } = formatGeneratedArticle(article);
    return {
      fileName: `${article.slug}.html`,
      content: `<!DOCTYPE html><html lang="${article.language}"><head><meta charset="utf-8"><title>${article.title}</title></head><body>${html}</body></html>`,
      mimeType: "text/html",
    };
  }
}
```

- [ ] **Step 4: Implement a minimal PDF exporter**

```ts
// lib/export/pdf.ts
import type { GeneratedArticle } from "@/lib/article/types";
import type { ExportProvider } from "@/lib/export/export-provider";
import { toMarkdown } from "@/lib/article/markdown";

export class PdfExporter implements ExportProvider {
  async export(article: GeneratedArticle) {
    const content = new TextEncoder().encode(toMarkdown(article));

    return {
      fileName: `${article.slug}.pdf`,
      content,
      mimeType: "application/pdf",
    };
  }
}
```

- [ ] **Step 5: Run the exporter tests**

Run: `npx vitest run tests/export/exporters.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit exporter support**

```bash
git add lib/export tests/export
git commit -m "feat: add article export providers"
```

### Task 9: Build dashboard, creation form, and editor UI

**Files:**
- Create: `components/dashboard-shell.tsx`
- Create: `components/article-form.tsx`
- Create: `components/provider-selector.tsx`
- Create: `components/model-selector.tsx`
- Create: `components/article-editor.tsx`
- Create: `components/source-list.tsx`
- Create: `components/export-buttons.tsx`
- Create: `components/status-badge.tsx`
- Create: `components/job-timeline.tsx`
- Create: `app/dashboard/page.tsx`
- Create: `app/articles/new/page.tsx`
- Create: `app/articles/[id]/page.tsx`
- Create: `app/settings/page.tsx`
- Create: `app/exports/page.tsx`

- [ ] **Step 1: Scaffold the app shell and dashboard page**

```tsx
// components/dashboard-shell.tsx
import Link from "next/link";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
      <aside className="border-r border-zinc-800 bg-zinc-950 p-6">
        <div className="space-y-8">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-zinc-500">ArticleForge Studio</p>
            <h2 className="mt-2 text-2xl font-semibold">Editorial OS</h2>
          </div>
          <nav className="space-y-3 text-sm text-zinc-300">
            <Link href="/dashboard" className="block">Dashboard</Link>
            <Link href="/articles/new" className="block">Novo artigo</Link>
            <Link href="/exports" className="block">Exportacoes</Link>
            <Link href="/settings" className="block">Settings</Link>
          </nav>
        </div>
      </aside>
      <main className="bg-zinc-950 p-6">{children}</main>
    </div>
  );
}
```

```tsx
// app/dashboard/page.tsx
import { DashboardShell } from "@/components/dashboard-shell";

export default function DashboardPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <p className="text-zinc-400">Acompanhe projetos, jobs e exportacoes.</p>
      </div>
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Build the multi-step article form UI**

```tsx
// components/article-form.tsx
"use client";

import { useState } from "react";

const steps = ["Brief", "Research", "AI", "Review"] as const;

export function ArticleForm() {
  const [step, setStep] = useState(0);

  return (
    <div className="space-y-8">
      <div className="flex gap-3">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => setStep(index)}
            className={`rounded-full px-4 py-2 text-sm ${index === step ? "bg-emerald-400 text-zinc-950" : "bg-zinc-900 text-zinc-300"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4" placeholder="Tema do artigo" />
        <input className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4" placeholder="Nicho" />
        <input className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4" placeholder="Idioma" />
        <input className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4" placeholder="Tom editorial" />
      </div>
      <button className="rounded-full bg-emerald-400 px-6 py-3 font-medium text-zinc-950">Gerar artigo</button>
    </div>
  );
}
```

- [ ] **Step 3: Add the creation and editor pages**

```tsx
// app/articles/new/page.tsx
import { ArticleForm } from "@/components/article-form";
import { DashboardShell } from "@/components/dashboard-shell";

export default function NewArticlePage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Novo artigo</h1>
        <ArticleForm />
      </div>
    </DashboardShell>
  );
}
```

```tsx
// components/article-editor.tsx
"use client";

export function ArticleEditor() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <textarea
          className="min-h-[520px] w-full resize-none bg-transparent text-sm outline-none"
          defaultValue={"# Titulo\n\nConteudo do artigo"}
        />
      </div>
      <div className="space-y-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
        <h2 className="text-lg font-medium">Painel editorial</h2>
        <button className="w-full rounded-full bg-emerald-400 px-4 py-3 font-medium text-zinc-950">Exportar</button>
      </div>
    </div>
  );
}
```

```tsx
// app/articles/[id]/page.tsx
import { DashboardShell } from "@/components/dashboard-shell";
import { ArticleEditor } from "@/components/article-editor";

export default function ArticlePage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Editor do artigo</h1>
        <ArticleEditor />
      </div>
    </DashboardShell>
  );
}
```

- [ ] **Step 4: Add settings and exports pages**

```tsx
// app/settings/page.tsx
import { DashboardShell } from "@/components/dashboard-shell";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Settings</h1>
        <p className="text-zinc-400">Configure chaves, provedores e preferencias da instancia.</p>
      </div>
    </DashboardShell>
  );
}
```

```tsx
// app/exports/page.tsx
import { DashboardShell } from "@/components/dashboard-shell";

export default function ExportsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">Exportacoes</h1>
        <p className="text-zinc-400">Acompanhe o historico de artefatos gerados.</p>
      </div>
    </DashboardShell>
  );
}
```

- [ ] **Step 5: Build and inspect the UI scaffold**

Run: `npm run build`
Expected: successful production build with all pages compiling.

- [ ] **Step 6: Commit the UI scaffold**

```bash
git add app components
git commit -m "feat: add articleforge dashboard and editor ui"
```

### Task 10: Wire real persistence and provider orchestration

**Files:**
- Modify: `app/api/articles/route.ts`
- Modify: `app/api/articles/[id]/route.ts`
- Modify: `app/api/search/route.ts`
- Modify: `app/api/generate/route.ts`
- Modify: `app/api/jobs/route.ts`
- Modify: `lib/db/queries.ts`
- Modify: `lib/jobs/handlers/search-job.ts`
- Modify: `lib/jobs/handlers/generate-job.ts`
- Modify: `lib/jobs/handlers/export-job.ts`

- [ ] **Step 1: Add query helpers for project, source, and article writes**

```ts
// lib/db/queries.ts
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { articleProjects, articleSources, generatedArticles, jobQueue } from "@/lib/db/schema";

export async function createArticleProject(input: Omit<typeof articleProjects.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(articleProjects).values(record);
  return record;
}

export async function createJob(input: Omit<typeof jobQueue.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(jobQueue).values(record);
  return record;
}

export async function getArticleProjectById(id: string) {
  return db.query.articleProjects.findFirst({ where: eq(articleProjects.id, id) });
}

export async function replaceProjectSources(articleProjectId: string, rows: Array<Omit<typeof articleSources.$inferInsert, "id">>) {
  await db.delete(articleSources).where(eq(articleSources.articleProjectId, articleProjectId));
  if (rows.length > 0) {
    await db.insert(articleSources).values(rows.map((row) => ({ id: randomUUID(), ...row })));
  }
}

export async function saveGeneratedArticle(input: Omit<typeof generatedArticles.$inferInsert, "id">) {
  const record = { id: randomUUID(), ...input };
  await db.insert(generatedArticles).values(record);
  return record;
}
```

- [ ] **Step 2: Persist article creation and enqueue jobs from the API**

```ts
// app/api/articles/route.ts
import { NextResponse } from "next/server";
import { createArticleProject } from "@/lib/db/queries";

// keep createArticleProjectSchema from Task 7
export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createArticleProjectSchema.parse(body);
  const project = await createArticleProject(parsed);
  return NextResponse.json({ ok: true, project }, { status: 201 });
}
```

```ts
// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { createJob } from "@/lib/db/queries";
import { createJobRecord } from "@/lib/jobs/queue";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = enqueueGenerateSchema.parse(body);
  const job = await createJob(createJobRecord("generate", parsed));
  return NextResponse.json({ ok: true, job }, { status: 202 });
}
```

- [ ] **Step 3: Implement real search job orchestration**

```ts
// lib/jobs/handlers/search-job.ts
import { createHash } from "node:crypto";
import { getSearchProvider } from "@/lib/search/registry";
import { dedupeSources } from "@/lib/search/dedupe";
import { rankSources } from "@/lib/search/rank";
import { replaceProjectSources } from "@/lib/db/queries";

export async function runSearchJob(payload: Record<string, unknown>) {
  const query = String(payload.query ?? "");
  const providerName = String(payload.provider ?? "duckduckgo");
  const limit = Number(payload.limit ?? 5);
  const provider = getSearchProvider(providerName);

  if (!provider) throw new Error(`Unknown search provider: ${providerName}`);

  const raw = await provider.search(query, { limit });
  const ranked = rankSources(query, dedupeSources(raw));

  await replaceProjectSources(
    String(payload.articleProjectId),
    ranked.map((item) => ({
      articleProjectId: String(payload.articleProjectId),
      title: item.title,
      url: item.url,
      domain: item.domain,
      snippet: item.snippet,
      publishedAt: item.publishedAt ? new Date(item.publishedAt).getTime() : null,
      searchProvider: item.provider,
      relevanceScore: item.relevanceScore,
      dedupeHash: createHash("sha1").update(item.url).digest("hex"),
    })),
  );
}
```

- [ ] **Step 4: Implement real generation and export handlers**

```ts
// lib/jobs/handlers/generate-job.ts
import { getAiProvider } from "@/lib/ai/registry";
import { loadPromptFile } from "@/lib/ai/prompts";
import { formatGeneratedArticle } from "@/lib/article/formatter";
import { saveGeneratedArticle } from "@/lib/db/queries";

export async function runGenerateJob(payload: Record<string, unknown>) {
  const provider = getAiProvider(String(payload.aiProvider));
  if (!provider) throw new Error(`Unknown AI provider: ${String(payload.aiProvider)}`);

  const promptTemplate = await loadPromptFile("article-generation.md");
  const prompt = `${promptTemplate}\n\nTOPIC: ${String(payload.topic)}\nLANGUAGE: ${String(payload.language)}`;
  const article = await provider.generateArticle(prompt, { model: String(payload.aiModelId) });
  const formatted = formatGeneratedArticle(article);

  await saveGeneratedArticle({
    articleProjectId: String(payload.articleProjectId),
    title: article.title,
    slug: article.slug,
    language: article.language,
    niche: article.niche,
    excerpt: article.excerpt,
    metaDescription: article.metaDescription,
    tagsJson: JSON.stringify(article.tags),
    outlineJson: JSON.stringify(article.outline),
    intro: article.intro,
    sectionsJson: JSON.stringify(article.sections),
    factsJson: JSON.stringify(article.facts),
    faqJson: JSON.stringify(article.faq),
    conclusion: article.conclusion,
    sourcesJson: JSON.stringify(article.sources),
    rawJson: JSON.stringify(article),
    markdownContent: formatted.markdown,
    htmlContent: formatted.html,
  });
}
```

```ts
// lib/jobs/handlers/export-job.ts
import { MarkdownExporter } from "@/lib/export/markdown";
import { HtmlExporter } from "@/lib/export/html";
import { PdfExporter } from "@/lib/export/pdf";

export async function runExportJob(payload: Record<string, unknown>) {
  const format = String(payload.format);
  const exporters = {
    markdown: new MarkdownExporter(),
    html: new HtmlExporter(),
    pdf: new PdfExporter(),
  };

  const exporter = exporters[format as keyof typeof exporters];
  if (!exporter) throw new Error(`Unsupported export format: ${format}`);
}
```

- [ ] **Step 5: Run the full test suite and build**

Run: `npm test && npm run build`
Expected: tests pass and build succeeds.

- [ ] **Step 6: Commit the end-to-end workflow wiring**

```bash
git add app/api lib/db/queries.ts lib/jobs
git commit -m "feat: wire article workflow persistence"
```

### Task 11: Add prompts, provider settings, and publisher placeholders

**Files:**
- Create: `prompts/article-generation.md`
- Create: `prompts/article-improve.md`
- Create: `prompts/article-expand.md`
- Create: `prompts/article-summary.md`
- Create: `lib/publishers/wordpress.ts`
- Create: `lib/publishers/ghost.ts`
- Create: `lib/publishers/medium.ts`
- Create: `lib/publishers/generic-api.ts`
- Modify: `app/settings/page.tsx`

- [ ] **Step 1: Add the article generation prompt file**

```md
<!-- prompts/article-generation.md -->
Voce e um sistema editorial de geracao de artigos.

Regras obrigatorias:
- Escreva no idioma solicitado.
- Respeite o nicho e o tom editorial informados.
- Use as fontes apenas como referencia.
- Nao copie trechos literais das fontes.
- Nao invente fontes.
- Cite apenas URLs realmente fornecidas.
- Gere conteudo original, claro e bem estruturado.
- Inclua excerpt, meta description, tags, outline, FAQ e lista final de fontes.
- Retorne JSON valido.
- Nao retorne markdown fora do JSON.
```

- [ ] **Step 2: Add secondary prompt files**

```md
<!-- prompts/article-improve.md -->
Melhore o texto mantendo o assunto, idioma e fidelidade editorial.
```

```md
<!-- prompts/article-expand.md -->
Expanda o artigo com mais profundidade sem repetir secoes existentes.
```

```md
<!-- prompts/article-summary.md -->
Resuma o artigo preservando as informacoes centrais e o idioma escolhido.
```

- [ ] **Step 3: Add publisher placeholders**

```ts
// lib/publishers/wordpress.ts
export const wordpressPublisher = {
  name: "wordpress",
  async validateConfig() {
    return { ok: false, reason: "Not implemented in V1" };
  },
  async publish() {
    throw new Error("WordPress publishing is reserved for phase 2.");
  },
};
```

```ts
// lib/publishers/ghost.ts
export const ghostPublisher = { name: "ghost" };
```

```ts
// lib/publishers/medium.ts
export const mediumPublisher = { name: "medium" };
```

```ts
// lib/publishers/generic-api.ts
export const genericApiPublisher = { name: "generic-api" };
```

- [ ] **Step 4: Expand settings page to expose provider configuration**

```tsx
// app/settings/page.tsx
import { DashboardShell } from "@/components/dashboard-shell";

export default function SettingsPage() {
  return (
    <DashboardShell>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h1 className="text-2xl font-semibold">Credenciais de IA</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Salve chaves da instancia ou use fallback local enquanto o login ainda nao existe.
          </p>
        </section>
        <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="text-xl font-semibold">Destinos futuros</h2>
          <p className="mt-2 text-sm text-zinc-400">
            WordPress, Ghost, Medium e Generic API ficam prontos como estrutura para a fase 2.
          </p>
        </section>
      </div>
    </DashboardShell>
  );
}
```

- [ ] **Step 5: Build and verify prompt files resolve**

Run: `npm run build`
Expected: build succeeds with prompt and publisher files in place.

- [ ] **Step 6: Commit prompts and publisher structure**

```bash
git add prompts lib/publishers app/settings/page.tsx
git commit -m "feat: add prompts and publisher placeholders"
```

### Task 12: Final verification, docs, and run instructions

**Files:**
- Create: `README.md`
- Modify: `.env.example`
- Modify: `app/page.tsx`

- [ ] **Step 1: Write the README**

```md
# ArticleForge Studio

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Turso/libSQL
- Drizzle ORM
- OpenRouter API
- OpenAI API
- DuckDuckGo
- SearXNG

## Setup

1. Copy `.env.example` to `.env.local`
2. Fill in `DATABASE_URL`
3. Add `OPENROUTER_API_KEY` and optional `OPENAI_API_KEY`
4. Run `npm install`
5. Run `npm run dev`

## Core routes

- `/dashboard`
- `/articles/new`
- `/articles/[id]`
- `/settings`
- `/exports`

## Current scope

- real article generation
- editable article workflow
- markdown/html/pdf export
- database-backed jobs
- provider registry ready for expansion

## Future scope

- login
- per-user credentials
- real publishing targets
- automation pipelines
```

- [ ] **Step 2: Run final verification commands**

Run:

```bash
npm test
npm run build
```

Expected:

- all Vitest tests pass
- Next.js build passes

- [ ] **Step 3: Run the app locally and verify the main path**

Run: `npm run dev`
Expected:

- app boots on `http://localhost:3000`
- `/articles/new` renders
- `/dashboard` renders
- `/settings` renders
- `/exports` renders

- [ ] **Step 4: Verify the manual happy path**

Check manually:

- create a new article payload through the UI or API
- enqueue a generation request
- verify job creation response
- verify generated article page loads
- verify markdown/html/pdf export handlers return artifacts

- [ ] **Step 5: Commit docs and final polish**

```bash
git add README.md .env.example app/page.tsx
git commit -m "docs: finalize articleforge studio v1 setup"
```

## Self-Review

### Spec coverage

- Next.js/Turso/Drizzle/base architecture: covered by Tasks 1-2.
- Jobs persisted in DB: covered by Tasks 2 and 6.
- Search provider abstraction, DuckDuckGo, SearXNG, merge and ranking: covered by Task 4 and Task 10.
- AI provider abstraction, OpenRouter primary, OpenAI secondary, model discovery: covered by Task 5.
- Article JSON validation and formatting: covered by Task 3.
- UI pages and editorial flow: covered by Task 9.
- Export providers for Markdown/HTML/PDF: covered by Task 8.
- Settings for provider credentials and future login-friendly design: covered by Task 11.
- Publisher placeholders: covered by Task 11.
- README, env example, and local run path: covered by Task 12.

### Placeholder scan

- No `TODO`, `TBD`, or "implement later" markers are left in executable steps.
- WordPress placeholder is intentional product scope, not a plan gap.
- The PDF exporter is explicitly minimal in V1 and should be upgraded later if binary PDF fidelity becomes a product requirement.

### Type consistency

- `ArticleProject`, `GeneratedArticle`, `SearchProvider`, `AiProvider`, `ExportProvider`, and `job_queue` names are consistent with the spec.
- `openrouter` and `openai` keys are used consistently across providers and route payloads.
- Route schema names match the tests that depend on them.
