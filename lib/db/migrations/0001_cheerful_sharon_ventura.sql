PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_article_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`topic` text NOT NULL,
	`niche` text NOT NULL,
	`language` text NOT NULL,
	`editorial_tone` text NOT NULL,
	`desired_length` text NOT NULL,
	`article_type` text NOT NULL,
	`source_count` integer NOT NULL,
	`search_provider` text NOT NULL,
	`ai_provider` text NOT NULL,
	`ai_model_id` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`current_error` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`ai_model_id`) REFERENCES `ai_models`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_article_projects`("id", "topic", "niche", "language", "editorial_tone", "desired_length", "article_type", "source_count", "search_provider", "ai_provider", "ai_model_id", "status", "current_error", "created_at", "updated_at") SELECT "id", "topic", "niche", "language", "editorial_tone", "desired_length", "article_type", "source_count", "search_provider", "ai_provider", "ai_model_id", "status", "current_error", "created_at", "updated_at" FROM `article_projects`;--> statement-breakpoint
DROP TABLE `article_projects`;--> statement-breakpoint
ALTER TABLE `__new_article_projects` RENAME TO `article_projects`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_article_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`article_project_id` text NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`domain` text NOT NULL,
	`snippet` text,
	`published_at` integer,
	`search_provider` text NOT NULL,
	`relevance_score` integer DEFAULT 0 NOT NULL,
	`dedupe_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`article_project_id`) REFERENCES `article_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_article_sources`("id", "article_project_id", "title", "url", "domain", "snippet", "published_at", "search_provider", "relevance_score", "dedupe_hash", "created_at", "updated_at") SELECT "id", "article_project_id", "title", "url", "domain", "snippet", "published_at", "search_provider", "relevance_score", "dedupe_hash", "created_at", "updated_at" FROM `article_sources`;--> statement-breakpoint
DROP TABLE `article_sources`;--> statement-breakpoint
ALTER TABLE `__new_article_sources` RENAME TO `article_sources`;--> statement-breakpoint
CREATE TABLE `__new_export_history` (
	`id` text PRIMARY KEY NOT NULL,
	`article_project_id` text NOT NULL,
	`generated_article_id` text NOT NULL,
	`format` text NOT NULL,
	`status` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`article_project_id`) REFERENCES `article_projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`generated_article_id`) REFERENCES `generated_articles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_export_history`("id", "article_project_id", "generated_article_id", "format", "status", "file_name", "file_path", "error_message", "created_at", "updated_at") SELECT "id", "article_project_id", "generated_article_id", "format", "status", "file_name", "file_path", "error_message", "created_at", "updated_at" FROM `export_history`;--> statement-breakpoint
DROP TABLE `export_history`;--> statement-breakpoint
ALTER TABLE `__new_export_history` RENAME TO `export_history`;--> statement-breakpoint
CREATE TABLE `__new_generated_articles` (
	`id` text PRIMARY KEY NOT NULL,
	`article_project_id` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`language` text NOT NULL,
	`niche` text NOT NULL,
	`excerpt` text NOT NULL,
	`meta_description` text NOT NULL,
	`tags_json` text NOT NULL,
	`outline_json` text NOT NULL,
	`intro` text NOT NULL,
	`sections_json` text NOT NULL,
	`facts_json` text NOT NULL,
	`faq_json` text NOT NULL,
	`conclusion` text NOT NULL,
	`sources_json` text NOT NULL,
	`raw_json` text NOT NULL,
	`markdown_content` text NOT NULL,
	`html_content` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`article_project_id`) REFERENCES `article_projects`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_generated_articles`("id", "article_project_id", "title", "slug", "language", "niche", "excerpt", "meta_description", "tags_json", "outline_json", "intro", "sections_json", "facts_json", "faq_json", "conclusion", "sources_json", "raw_json", "markdown_content", "html_content", "created_at", "updated_at") SELECT "id", "article_project_id", "title", "slug", "language", "niche", "excerpt", "meta_description", "tags_json", "outline_json", "intro", "sections_json", "facts_json", "faq_json", "conclusion", "sources_json", "raw_json", "markdown_content", "html_content", "created_at", "updated_at" FROM `generated_articles`;--> statement-breakpoint
DROP TABLE `generated_articles`;--> statement-breakpoint
ALTER TABLE `__new_generated_articles` RENAME TO `generated_articles`;