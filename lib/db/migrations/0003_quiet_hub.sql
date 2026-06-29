CREATE TABLE `workspaces` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`is_default` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `workspace_settings` (
	`id` text PRIMARY KEY NOT NULL,
	`default_language` text,
	`default_tone` text,
	`default_article_type` text,
	`blocked_domains_json` text,
	`preferred_search_provider` text,
	`preferred_ai_provider` text,
	`preferred_model_id` text,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `api_providers` ADD `workspace_id` text REFERENCES workspaces(id) ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE `article_projects` ADD `workspace_id` text REFERENCES workspaces(id) ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE `publish_targets` ADD `workspace_id` text REFERENCES workspaces(id) ON DELETE cascade;
