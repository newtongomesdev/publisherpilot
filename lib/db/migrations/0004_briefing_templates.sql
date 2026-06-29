ALTER TABLE `article_projects` ADD `subtitle` text;
--> statement-breakpoint
ALTER TABLE `article_projects` ADD `keywords_json` text;
--> statement-breakpoint
ALTER TABLE `article_projects` ADD `structure_notes` text;
--> statement-breakpoint
CREATE TABLE `briefing_templates` (
	`id` text PRIMARY KEY NOT NULL,
	`workspace_id` text NOT NULL,
	`name` text NOT NULL,
	`topic_hint` text,
	`niche` text NOT NULL,
	`subtitle` text,
	`keywords_json` text,
	`structure_notes` text,
	`language` text NOT NULL,
	`editorial_tone` text NOT NULL,
	`desired_length` text NOT NULL,
	`article_type` text NOT NULL,
	`source_count` integer NOT NULL,
	`search_provider` text NOT NULL,
	`ai_provider` text NOT NULL,
	`ai_model_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON UPDATE no action ON DELETE cascade
);
