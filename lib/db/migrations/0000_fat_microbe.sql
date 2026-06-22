CREATE TABLE `ai_models` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_key` text NOT NULL,
	`model_id` text NOT NULL,
	`slug` text,
	`name` text NOT NULL,
	`context_window` integer,
	`pricing_json` text,
	`is_favorite` integer DEFAULT false NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_synced_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `api_providers` (
	`id` text PRIMARY KEY NOT NULL,
	`provider_key` text NOT NULL,
	`display_name` text NOT NULL,
	`base_url` text,
	`api_key_encrypted` text,
	`source_type` text DEFAULT 'env' NOT NULL,
	`is_enabled` integer DEFAULT true NOT NULL,
	`metadata_json` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `article_projects` (
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
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `article_sources` (
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
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `export_history` (
	`id` text PRIMARY KEY NOT NULL,
	`article_project_id` text NOT NULL,
	`generated_article_id` text NOT NULL,
	`format` text NOT NULL,
	`status` text NOT NULL,
	`file_name` text NOT NULL,
	`file_path` text,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `generated_articles` (
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
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `job_queue` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`status` text DEFAULT 'queued' NOT NULL,
	`payload_json` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`max_attempts` integer DEFAULT 3 NOT NULL,
	`scheduled_at` integer,
	`started_at` integer,
	`finished_at` integer,
	`error_message` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `publish_targets` (
	`id` text PRIMARY KEY NOT NULL,
	`target_type` text NOT NULL,
	`name` text NOT NULL,
	`is_enabled` integer DEFAULT false NOT NULL,
	`config_json` text,
	`last_validated_at` integer,
	`notes` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE TABLE `user_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`default_language` text,
	`default_tone` text,
	`default_article_type` text,
	`blocked_domains_json` text,
	`preferred_search_provider` text,
	`preferred_ai_provider` text,
	`preferred_model_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
