import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  aiModelId: text("ai_model_id")
    .notNull()
    .references(() => aiModels.id),
  status: text("status").notNull().default("draft"),
  currentError: text("current_error"),
  ...timestamps,
});

export const articleSources = sqliteTable("article_sources", {
  id: text("id").primaryKey(),
  articleProjectId: text("article_project_id")
    .notNull()
    .references(() => articleProjects.id, { onDelete: "cascade" }),
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
  articleProjectId: text("article_project_id")
    .notNull()
    .references(() => articleProjects.id, { onDelete: "cascade" }),
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
  articleProjectId: text("article_project_id")
    .notNull()
    .references(() => articleProjects.id, { onDelete: "cascade" }),
  generatedArticleId: text("generated_article_id")
    .notNull()
    .references(() => generatedArticles.id, { onDelete: "cascade" }),
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

export const schema = {
  userSettings,
  apiProviders,
  aiModels,
  articleProjects,
  articleSources,
  generatedArticles,
  exportHistory,
  publishTargets,
  jobQueue,
};
