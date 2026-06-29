CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000),
	`updated_at` integer DEFAULT (unixepoch() * 1000),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `api_providers` ADD `user_id` text REFERENCES users(id) ON DELETE cascade;
--> statement-breakpoint
ALTER TABLE `article_projects` ADD `user_id` text REFERENCES users(id) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `publish_targets` ADD `user_id` text REFERENCES users(id) ON DELETE cascade;
