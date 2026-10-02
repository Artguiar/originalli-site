CREATE TABLE `life_deadlines` (
	`policy_id` text PRIMARY KEY NOT NULL,
	`rh_day` integer NOT NULL,
	`technical_day` integer NOT NULL,
	`reminder_days` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `life_permissions` (
	`user_id` text PRIMARY KEY NOT NULL,
	`config` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `life_transmissions` (
	`id` text PRIMARY KEY NOT NULL,
	`policy_id` text NOT NULL,
	`competence` text NOT NULL,
	`file_id` text NOT NULL,
	`protocol` text NOT NULL,
	`sent_at` text NOT NULL,
	`user_id` text NOT NULL,
	`created` text NOT NULL
);
